import { describe, expect, it } from 'vitest';

import {
  normalizeMarket,
  normalizePosition,
  normalizeTrade,
  parseClobTokenIds,
  parseOutcomePrices,
} from '../normalizer';
import type { DataApiPosition, DataApiTrade, GammaMarket } from '../types';

describe('parseOutcomePrices', () => {
  it('parses valid JSON array values', () => {
    expect(parseOutcomePrices('["0.65","0.35"]')).toEqual({ yes: 0.65, no: 0.35 });
  });

  it('returns null for invalid JSON', () => {
    expect(parseOutcomePrices('{bad')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseOutcomePrices('')).toBeNull();
  });

  it('returns null for single-element array', () => {
    expect(parseOutcomePrices('["0.65"]')).toBeNull();
  });
});

describe('parseClobTokenIds', () => {
  it('parses valid token id array', () => {
    expect(parseClobTokenIds('["yes-token","no-token"]')).toEqual(['yes-token', 'no-token']);
  });

  it('returns null for invalid JSON', () => {
    expect(parseClobTokenIds('not-json')).toBeNull();
  });
});

describe('normalizeMarket', () => {
  const baseMarket: GammaMarket = {
    id: 'gamma-1',
    question: 'Will BTC be above $100k by year end?',
    conditionId: 'condition-abc',
    slug: 'btc-100k-year-end',
    description: 'Binary market',
    category: 'Crypto',
    endDate: '2026-12-31T23:59:59.000Z',
    startDate: '2026-01-01T00:00:00.000Z',
    outcomes: '["Yes","No"]',
    outcomePrices: '["0.61","0.39"]',
    volume: '1200000',
    volumeNum: 1200000,
    volume24hr: 250000,
    liquidity: '500000',
    liquidityNum: 500000,
    active: true,
    closed: false,
    archived: false,
    featured: true,
    enableOrderBook: true,
    acceptingOrders: true,
    clobTokenIds: '["token-yes","token-no"]',
    fee: '0',
    makerBaseFee: 0,
    takerBaseFee: 200,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    events: [
      {
        id: 'ev-1',
        slug: 'btc-year-end',
        title: 'BTC Year End',
        description: 'Event',
        category: 'Crypto',
        subcategory: 'Bitcoin',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T23:59:59.000Z',
        active: true,
        closed: false,
        volume: 100,
        liquidity: 100,
        negRisk: false,
        negRiskMarketID: '',
      },
    ],
  };

  it('maps required canonical fields', () => {
    const normalized = normalizeMarket(baseMarket);
    expect(normalized.venueId).toBe('polymarket');
    expect(normalized.venueMarketId).toBe('condition-abc');
    expect(normalized.question).toBe(baseMarket.question);
    expect(normalized.status).toBe('open');
    expect(normalized.feeBps).toBe(200);
  });

  it('maps closed market status', () => {
    const normalized = normalizeMarket({ ...baseMarket, closed: true, outcomePrices: '["0.5","0.5"]' });
    expect(normalized.status).toBe('closed');
  });
});

describe('normalizeTrade', () => {
  it('maps side, direction and timestamp', () => {
    const rawTrade: DataApiTrade = {
      proxyWallet: '0xabc',
      side: 'BUY',
      asset: 'token-yes',
      conditionId: 'condition-abc',
      size: 123,
      price: 0.77,
      timestamp: 1710000000,
      title: 'Market title',
      slug: 'market-title',
      outcome: 'Yes',
      outcomeIndex: 0,
      transactionHash: '0xhash',
    };

    const normalized = normalizeTrade(rawTrade, 'user-1', 'market-1');
    expect(normalized.side).toBe('YES');
    expect(normalized.direction).toBe('buy');
    expect(normalized.ts).toBe(new Date(1710000000 * 1000).toISOString());
  });
});

describe('normalizePosition', () => {
  it('computes pnl fields and open status from size', () => {
    const rawPosition: DataApiPosition = {
      asset: 'token-yes',
      conditionId: 'condition-abc',
      size: 10,
      avgPrice: 0.6,
      initialValue: 6,
      currentValue: 7,
      cashPnl: 1.2,
      percentPnl: 20,
      totalBought: 10,
      realizedPnl: 0.2,
      curPrice: 0.7,
      redeemable: false,
      title: 'Market title',
      slug: 'market-title',
      outcome: 'Yes',
      outcomeIndex: 0,
      eventSlug: 'event',
    };

    const normalized = normalizePosition(rawPosition, 'user-1', 'market-1');
    expect(normalized.status).toBe('open');
    expect(normalized.realizedPnl).toBe(0.2);
    expect(normalized.unrealizedPnl).toBeCloseTo(1.0);
    expect(normalized.positionSide).toBe('YES');
  });
});
