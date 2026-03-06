import PQueue from 'p-queue';

import type {
  ClobOrderBook,
  ClobPricePoint,
  DataApiActivity,
  DataApiPosition,
  DataApiTrade,
  GammaEvent,
  GammaMarket,
} from './types';

const GAMMA_BASE_URL = 'https://gamma-api.polymarket.com';
const DATA_BASE_URL = 'https://data-api.polymarket.com';
const CLOB_BASE_URL = 'https://clob.polymarket.com';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readRetryAfterMs(headerValue: string | null): number | null {
  if (!headerValue) return null;

  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds) && Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(headerValue);
  if (Number.isNaN(dateMs)) {
    return null;
  }

  return Math.max(0, dateMs - Date.now());
}

function toArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data as T[];
    }
  }

  return [];
}

export class PolymarketApiClient {
  private gammaQueue: PQueue;
  private dataQueue: PQueue;
  private clobQueue: PQueue;

  constructor() {
    this.gammaQueue = new PQueue({ concurrency: 5, interval: 1000, intervalCap: 10 });
    this.dataQueue = new PQueue({ concurrency: 3, interval: 1000, intervalCap: 5 });
    this.clobQueue = new PQueue({ concurrency: 3, interval: 1000, intervalCap: 10 });
  }

  private async fetchWithRetry(url: string, queue: PQueue, retries = 3): Promise<unknown> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        const response = await queue.add(() => fetch(url));
        if (!response) {
          throw new Error('Queue task returned no response');
        }

        if (!response.ok) {
          const error = new Error(`Request failed: ${response.status} ${response.statusText}`);

          if (response.status === 429 && attempt < retries) {
            const retryAfterMs = readRetryAfterMs(response.headers.get('Retry-After'));
            const waitMs = retryAfterMs ?? 2 ** (attempt - 1) * 1000;
            console.error('[PolymarketApiClient] rate limited', {
              url,
              status: response.status,
              attempt,
              waitMs,
            });
            await sleep(waitMs);
            continue;
          }

          console.error('[PolymarketApiClient] request failed', {
            url,
            status: response.status,
            attempt,
          });
          throw error;
        }

        return (await response.json()) as unknown;
      } catch (error) {
        lastError = error;
        if (attempt >= retries) {
          break;
        }

        const waitMs = 2 ** (attempt - 1) * 1000;
        console.error('[PolymarketApiClient] retrying request after error', {
          url,
          attempt,
          waitMs,
          error: error instanceof Error ? error.message : String(error),
        });
        await sleep(waitMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`Failed to fetch after retries: ${url}`);
  }

  async getMarkets(params: {
    limit?: number;
    offset?: number;
    active?: boolean;
    closed?: boolean;
  }): Promise<GammaMarket[]> {
    const search = new URLSearchParams();
    if (params.limit !== undefined) search.set('limit', String(params.limit));
    if (params.offset !== undefined) search.set('offset', String(params.offset));
    if (params.active !== undefined) search.set('active', String(params.active));
    if (params.closed !== undefined) search.set('closed', String(params.closed));

    const payload = await this.fetchWithRetry(`${GAMMA_BASE_URL}/markets?${search.toString()}`, this.gammaQueue);
    return toArray<GammaMarket>(payload);
  }

  async getEvents(params: { limit?: number; offset?: number; active?: boolean }): Promise<GammaEvent[]> {
    const search = new URLSearchParams();
    if (params.limit !== undefined) search.set('limit', String(params.limit));
    if (params.offset !== undefined) search.set('offset', String(params.offset));
    if (params.active !== undefined) search.set('active', String(params.active));

    const payload = await this.fetchWithRetry(`${GAMMA_BASE_URL}/events?${search.toString()}`, this.gammaQueue);
    return toArray<GammaEvent>(payload);
  }

  async getMarket(id: string): Promise<GammaMarket> {
    const payload = await this.fetchWithRetry(`${GAMMA_BASE_URL}/markets/${id}`, this.gammaQueue);
    return payload as GammaMarket;
  }

  async getPositions(walletAddress: string): Promise<DataApiPosition[]> {
    const payload = await this.fetchWithRetry(
      `${DATA_BASE_URL}/positions?user=${encodeURIComponent(walletAddress)}`,
      this.dataQueue
    );
    return toArray<DataApiPosition>(payload);
  }

  async getActivity(
    walletAddress: string,
    params?: { type?: string; start?: number; end?: number; side?: string }
  ): Promise<DataApiActivity[]> {
    const search = new URLSearchParams({ user: walletAddress });
    if (params?.type) search.set('type', params.type);
    if (params?.start !== undefined) search.set('start', String(params.start));
    if (params?.end !== undefined) search.set('end', String(params.end));
    if (params?.side) search.set('side', params.side);

    const payload = await this.fetchWithRetry(`${DATA_BASE_URL}/activity?${search.toString()}`, this.dataQueue);
    return toArray<DataApiActivity>(payload);
  }

  async getTrades(walletAddress: string, params?: { market?: string }): Promise<DataApiTrade[]> {
    const search = new URLSearchParams({ user: walletAddress });
    if (params?.market) search.set('market', params.market);

    const payload = await this.fetchWithRetry(`${DATA_BASE_URL}/trades?${search.toString()}`, this.dataQueue);
    return toArray<DataApiTrade>(payload);
  }

  async getMidpoint(tokenId: string): Promise<number> {
    const payload = (await this.fetchWithRetry(
      `${CLOB_BASE_URL}/midpoint?token_id=${encodeURIComponent(tokenId)}`,
      this.clobQueue
    )) as { midpoint?: string | number; mid?: string | number; price?: string | number };

    const value = payload.midpoint ?? payload.mid ?? payload.price;
    const num = typeof value === 'number' ? value : Number(value ?? NaN);
    return Number.isFinite(num) ? num : 0;
  }

  async getPrice(tokenId: string, side: 'BUY' | 'SELL'): Promise<number> {
    const payload = (await this.fetchWithRetry(
      `${CLOB_BASE_URL}/price?token_id=${encodeURIComponent(tokenId)}&side=${side}`,
      this.clobQueue
    )) as { price?: string | number };

    const num = typeof payload.price === 'number' ? payload.price : Number(payload.price ?? NaN);
    return Number.isFinite(num) ? num : 0;
  }

  async getBook(tokenId: string): Promise<ClobOrderBook> {
    const payload = await this.fetchWithRetry(
      `${CLOB_BASE_URL}/book?token_id=${encodeURIComponent(tokenId)}`,
      this.clobQueue
    );
    return payload as ClobOrderBook;
  }

  async getPriceHistory(
    conditionId: string,
    interval = '1d',
    fidelity = 60
  ): Promise<ClobPricePoint[]> {
    const payload = await this.fetchWithRetry(
      `${CLOB_BASE_URL}/prices-history?market=${encodeURIComponent(conditionId)}&interval=${interval}&fidelity=${fidelity}`,
      this.clobQueue
    );

    if (Array.isArray(payload)) {
      return payload as ClobPricePoint[];
    }

    if (payload && typeof payload === 'object') {
      const history = (payload as { history?: unknown }).history;
      if (Array.isArray(history)) {
        return history as ClobPricePoint[];
      }
    }

    return [];
  }
}
