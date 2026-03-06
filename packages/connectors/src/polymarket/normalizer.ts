import type {
  Market,
  MarketPrice,
  Position,
  Trade,
} from '@polyplot/core';

import type { DataApiActivity, DataApiPosition, DataApiTrade, GammaMarket } from './types';

function isResolvedPrice(yesProb: number): boolean {
  return yesProb > 0.99 || yesProb < 0.01;
}

function toIsoFromUnixSeconds(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

function normalizeOutcomeToSide(outcome: string): 'YES' | 'NO' {
  return outcome.trim().toLowerCase() === 'yes' ? 'YES' : 'NO';
}

export function normalizeMarket(raw: GammaMarket, _userId?: string): Omit<Market, 'marketId'> {
  const parsedPrices = parseOutcomePrices(raw.outcomePrices);
  const parsedClobTokenIds = parseClobTokenIds(raw.clobTokenIds);

  let status: Market['status'] = 'open';
  if (raw.closed) {
    status = parsedPrices && isResolvedPrice(parsedPrices.yes) ? 'resolved' : 'closed';
  }

  const tags = [raw.slug];
  if (parsedClobTokenIds) {
    tags.push(`clob_yes:${parsedClobTokenIds[0]}`);
    tags.push(`clob_no:${parsedClobTokenIds[1]}`);
  }

  return {
    venueId: 'polymarket',
    venueMarketId: raw.conditionId,
    question: raw.question,
    description: raw.description ?? null,
    categoryRaw: raw.category ?? null,
    subcategoryRaw: raw.events?.[0]?.subcategory ?? null,
    subsubcategoryRaw: null,
    taxCategoryId: null,
    tags,
    startTime: raw.startDate ?? null,
    endTime: raw.endDate ?? null,
    status,
    feeBps: Number.isFinite(raw.takerBaseFee) ? raw.takerBaseFee : null,
    url: raw.slug ? `https://polymarket.com/event/${raw.slug}` : null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeTrade(
  raw: DataApiTrade | DataApiActivity,
  userId: string,
  marketId: string
): Omit<Trade, 'tradeId'> {
  return {
    userId: userId as Trade['userId'],
    venueId: 'polymarket',
    marketId: marketId as Trade['marketId'],
    ts: toIsoFromUnixSeconds(raw.timestamp),
    side: normalizeOutcomeToSide(raw.outcome),
    direction: raw.side === 'BUY' ? 'buy' : 'sell',
    quantity: raw.size,
    priceProb: raw.price,
    feePaid: 0,
    txRef: 'transactionHash' in raw ? raw.transactionHash ?? null : null,
    orderRef: null,
    status: 'filled',
    rawRefId: raw.asset,
  };
}

export function normalizePosition(
  raw: DataApiPosition,
  userId: string,
  marketId: string
): Omit<Position, 'positionId'> {
  const unrealizedPnl = (raw.cashPnl ?? 0) - (raw.realizedPnl ?? 0);

  return {
    cycleId: `${marketId}:${normalizeOutcomeToSide(raw.outcome)}`,
    userId: userId as Position['userId'],
    venueId: 'polymarket',
    marketId: marketId as Position['marketId'],
    positionSide: normalizeOutcomeToSide(raw.outcome),
    status: raw.size > 0 ? 'open' : 'closed',
    openedAt: null,
    closedAt: raw.size > 0 ? null : new Date().toISOString(),
    resolvedAt: null,
    netQuantity: raw.size,
    avgEntryProb: raw.avgPrice,
    avgExitProb: null,
    costBasis: raw.initialValue,
    currentValue: raw.currentValue,
    realizedPnl: raw.realizedPnl,
    unrealizedPnl,
    roiRealized: null,
    roiTotal: raw.initialValue ? raw.cashPnl / raw.initialValue : null,
    lastMarkProb: raw.curPrice,
    lastMarkTs: new Date().toISOString(),
  };
}

export function normalizeMarketPrice(
  raw: GammaMarket,
  marketId: string
): Omit<MarketPrice, 'marketPriceId'> {
  const parsedPrices = parseOutcomePrices(raw.outcomePrices);
  const yes = parsedPrices?.yes ?? null;

  return {
    marketId: marketId as MarketPrice['marketId'],
    ts: raw.updatedAt ?? new Date().toISOString(),
    midProb: yes,
    bestBidProb: null,
    bestAskProb: null,
    spread: null,
    volume24h: raw.volume24hr ?? null,
    liquidityScore: raw.liquidityNum ?? null,
    stabilityScore: null,
    source: 'gamma',
  };
}

export function parseOutcomePrices(outcomePrices: string): { yes: number; no: number } | null {
  try {
    const parsed: unknown = JSON.parse(outcomePrices);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return null;
    }

    const yes = Number.parseFloat(String(parsed[0]));
    const no = Number.parseFloat(String(parsed[1]));

    if (!Number.isFinite(yes) || !Number.isFinite(no)) {
      return null;
    }

    return { yes, no };
  } catch {
    return null;
  }
}

export function parseClobTokenIds(clobTokenIds: string): [string, string] | null {
  try {
    const parsed: unknown = JSON.parse(clobTokenIds);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return null;
    }

    const yes = String(parsed[0]);
    const no = String(parsed[1]);

    if (!yes || !no) {
      return null;
    }

    return [yes, no];
  } catch {
    return null;
  }
}
