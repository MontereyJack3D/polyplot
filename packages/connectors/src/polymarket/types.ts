// -- Gamma API --
export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  description: string;
  category: string;
  endDate: string;
  startDate: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volumeNum: number;
  volume24hr: number;
  liquidity: string;
  liquidityNum: number;
  active: boolean;
  closed: boolean;
  archived: boolean;
  featured: boolean;
  enableOrderBook: boolean;
  acceptingOrders: boolean;
  clobTokenIds: string;
  fee: string;
  makerBaseFee: number;
  takerBaseFee: number;
  createdAt: string;
  updatedAt: string;
  events: GammaEvent[];
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  volume: number;
  liquidity: number;
  negRisk: boolean;
  negRiskMarketID: string;
}

// -- Data API --
export interface DataApiPosition {
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  title: string;
  slug: string;
  outcome: string;
  outcomeIndex: number;
  eventSlug: string;
  endDate?: string;
}

export interface DataApiActivity {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: 'BUY' | 'SELL';
  outcomeIndex: number;
  title: string;
  slug: string;
  outcome: string;
}

export interface DataApiTrade {
  proxyWallet: string;
  side: 'BUY' | 'SELL';
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  outcome: string;
  outcomeIndex: number;
  transactionHash?: string;
}

// -- CLOB API --
export interface ClobOrderBook {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  hash: string;
  timestamp: string;
}

export interface ClobPricePoint {
  t: number;
  p: number;
}
