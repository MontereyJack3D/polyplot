import type { RawBalance, RawMarket, RawPosition, RawPrice, RawResolution, RawTrade, VenueConnector } from '../types';

export class KalshiConnector implements VenueConnector {
  readonly venueId = 'kalshi';

  async fetchMarkets(): Promise<RawMarket[]> {
    return [];
  }

  async fetchPrices(_marketIds: string[]): Promise<RawPrice[]> {
    return [];
  }

  async fetchTrades(_accountRef: string): Promise<RawTrade[]> {
    return [];
  }

  async fetchPositions(_accountRef: string): Promise<RawPosition[]> {
    return [];
  }

  async fetchBalances(_accountRef: string): Promise<RawBalance> {
    return { total: 0, used: 0, available: 0 };
  }

  async fetchResolutions(): Promise<RawResolution[]> {
    return [];
  }
}
