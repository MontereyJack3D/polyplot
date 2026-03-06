import { PolymarketApiClient } from './api-client';
import {
  normalizeMarket,
  normalizeMarketPrice,
  normalizePosition,
  normalizeTrade,
  parseOutcomePrices,
} from './normalizer';
import type { GammaMarket } from './types';

export class PolymarketConnector {
  readonly venueId = 'polymarket' as const;
  private client: PolymarketApiClient;

  constructor() {
    this.client = new PolymarketApiClient();
  }

  async fetchMarkets(): Promise<Array<ReturnType<typeof normalizeMarket>>> {
    const allMarkets: GammaMarket[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const batch = await this.client.getMarkets({ limit, offset, active: true });
      allMarkets.push(...batch);
      offset += limit;
      hasMore = batch.length === limit;
    }

    offset = 0;
    hasMore = true;
    while (hasMore) {
      const batch = await this.client.getMarkets({ limit, offset, closed: true });
      allMarkets.push(...batch);
      offset += limit;
      hasMore = batch.length === limit;
      if (offset >= 500) break;
    }

    return allMarkets.map((market) => normalizeMarket(market));
  }

  async fetchPrices(
    _markets: Array<{ marketId: string; venueMarketId: string; clobTokenIds?: string }>
  ): Promise<Array<ReturnType<typeof normalizeMarketPrice>>> {
    const gammaMarkets = await this.client.getMarkets({ limit: 100, active: true });
    return gammaMarkets.map((market) => normalizeMarketPrice(market, market.conditionId));
  }

  async fetchTrades(
    walletAddress: string,
    userId: string
  ): Promise<Array<ReturnType<typeof normalizeTrade>>> {
    const trades = await this.client.getTrades(walletAddress);
    return trades.map((trade) => normalizeTrade(trade, userId, trade.conditionId));
  }

  async fetchPositions(
    walletAddress: string,
    userId: string
  ): Promise<Array<ReturnType<typeof normalizePosition>>> {
    const positions = await this.client.getPositions(walletAddress);
    return positions
      .filter((position) => position.size > 0)
      .map((position) => normalizePosition(position, userId, position.conditionId));
  }

  async fetchActivity(
    walletAddress: string,
    params?: { start?: number; end?: number }
  ): Promise<unknown[]> {
    return this.client.getActivity(walletAddress, {
      type: 'TRADE',
      ...params,
    });
  }

  async fetchBalances(
    walletAddress: string,
    _userId: string
  ): Promise<{
    totalBalance: number;
    usedBalance: number;
    availableBalance: number;
    pnl24h: number | null;
  }> {
    const positions = await this.client.getPositions(walletAddress);
    const totalValue = positions.reduce((sum, position) => sum + (position.currentValue || 0), 0);
    const initialValue = positions.reduce((sum, position) => sum + (position.initialValue || 0), 0);

    return {
      totalBalance: totalValue,
      usedBalance: initialValue,
      availableBalance: Math.max(0, totalValue - initialValue),
      pnl24h: null,
    };
  }

  async fetchResolutions(): Promise<
    Array<{
      venueMarketId: string;
      resolvedAt: string;
      outcome: string;
      settlementProb: number;
    }>
  > {
    const closedMarkets = await this.client.getMarkets({ closed: true, limit: 100 });
    const resolved: Array<{
      venueMarketId: string;
      resolvedAt: string;
      outcome: string;
      settlementProb: number;
    }> = [];

    for (const market of closedMarkets) {
      const prices = parseOutcomePrices(market.outcomePrices);
      if (!prices) continue;

      if (prices.yes > 0.99 || prices.yes < 0.01) {
        resolved.push({
          venueMarketId: market.conditionId,
          resolvedAt: market.updatedAt || market.endDate,
          outcome: prices.yes > 0.99 ? 'YES' : 'NO',
          settlementProb: prices.yes > 0.99 ? 1 : 0,
        });
      }
    }

    return resolved;
  }
}
