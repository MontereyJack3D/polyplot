export interface VenueConnector {
  readonly venueId: string;
  fetchMarkets(): Promise<RawMarket[]>;
  fetchPrices(marketIds: string[]): Promise<RawPrice[]>;
  fetchTrades(accountRef: string): Promise<RawTrade[]>;
  fetchPositions(accountRef: string): Promise<RawPosition[]>;
  fetchBalances(accountRef: string): Promise<RawBalance>;
  fetchResolutions(): Promise<RawResolution[]>;
}

export interface RawMarket {
  [key: string]: unknown;
}

export interface RawPrice {
  [key: string]: unknown;
}

export interface RawTrade {
  [key: string]: unknown;
}

export interface RawPosition {
  [key: string]: unknown;
}

export interface RawBalance {
  total: number;
  used: number;
  available: number;
}

export interface RawResolution {
  [key: string]: unknown;
}
