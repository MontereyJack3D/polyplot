import type { AchievementTier, ProbabilityBand, VenueId } from './enums';

// ── Dashboard ──
export interface DashboardSummaryResponse {
  timeframe: string;
  venue: string;
  edgeScore: number;
  edgePercentile: number;
  momentum: number;
  winRate: number;
  roi: number;
  pnlTotal: number;
  pnlRealized: number;
  winStreakCurrent: number;
  winStreakBest: number;
  activeMarketsCount: number;
}

export interface ProbabilitySkillBand {
  band: ProbabilityBand;
  trades: number;
  winRate: number;
  roi: number;
  edgeContribution: number;
  logLossAvg: number;
  calibrationError: number;
}

export interface ProbabilitySkillResponse {
  bands: ProbabilitySkillBand[];
}

export interface ActivityItem {
  id: string;
  ts: string;
  type: 'resolution' | 'trade' | 'achievement' | 'milestone';
  marketId: string | null;
  title: string;
  result: 'win' | 'loss' | 'pending' | null;
  pnl: number | null;
  edgeDelta: number | null;
}

export interface ActivityResponse {
  items: ActivityItem[];
  nextCursor: string | null;
}

// ── Profile ──
export interface ProfileSummaryResponse extends DashboardSummaryResponse {
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  joinDate: string;
  totalTrades: number;
  venues: VenueId[];
}

export interface EdgeMapResponse {
  categoryEdge: Array<{
    category: string;
    edge: number;
    winRate: number;
    trades: number;
  }>;
  probabilityBands: Array<{
    band: ProbabilityBand;
    edgeContribution: number;
    winRate: number;
    trades: number;
  }>;
  venueEdge: Array<{
    venue: VenueId;
    edgeContribution: number;
  }>;
  timeHorizonEdge: Array<{
    bucket: string;
    edgeContribution: number;
  }>;
}

export interface AchievementResponse {
  unlocked: Array<{
    name: string;
    family: string;
    tier: AchievementTier;
    unlockedAt: string;
    iconRef: string | null;
  }>;
  inProgress: Array<{
    name: string;
    family: string;
    tier: AchievementTier;
    progress: number;
    target: number;
    iconRef: string | null;
  }>;
  hiddenLockedCount: number;
}

// ── Markets ──
export interface MarketSearchItem {
  marketId: string;
  question: string;
  prob: number;
  venue: VenueId;
  category: string;
  subcategory: string | null;
  volume24h: number | null;
  endTime: string | null;
  status: string;
}

export interface MarketSearchResponse {
  items: MarketSearchItem[];
  nextCursor: string | null;
}

export interface VenueComparison {
  venues: Array<{
    venue: VenueId;
    yes: number;
    no: number;
    feesBps: number;
  }>;
  spread: number;
  arbDetected: boolean;
}

export interface EdgeAlignment {
  categoryEdgeScore: number;
  band: ProbabilityBand;
  bandWinRate: number;
  bandRoi: number;
  similarTrades: number;
  alignment: 'strong' | 'moderate' | 'weak' | 'no_data';
}

export interface MarketSignal {
  type: string;
  severity: number;
  label: string;
  explain: string;
}

export interface MarketIntelligenceResponse {
  market: {
    marketId: string;
    question: string;
    category: string;
    subcategory: string | null;
    endTime: string | null;
  };
  prices: {
    current: { venue: VenueId; prob: number };
    series: Array<{
      ts: string;
      prob: number;
      volume24h: number | null;
      liquidityScore: number | null;
    }>;
  };
  venueComparison: VenueComparison | null;
  edgeAlignment: EdgeAlignment | null;
  signals: MarketSignal[];
  position: {
    hasPosition: boolean;
    venue?: VenueId;
    side?: string;
    entryProb?: number;
    currentProb?: number;
    pnl?: number;
  };
  relatedMarkets: Array<{
    marketId: string;
    question: string;
    prob: number;
  }>;
}

// ── Wallet ──
export interface WalletSummaryResponse {
  totalBalance: number;
  pnl24h: number;
  venues: Array<{
    venue: VenueId;
    total: number;
    used: number;
    available: number;
    pnl24h: number;
  }>;
}

// ── Drilldown ──
export interface DrilldownRow {
  label: string;
  value: number;
  trades: number;
  roi: number;
  pnl: number;
  edgeContribution: number;
}

export interface DrilldownResponse {
  metric: string;
  overall: { value: number; trades: number };
  levels: Array<{
    level: number;
    rows: DrilldownRow[];
  }>;
}

// ── Access ──
export interface AccessStatusResponse {
  eligible: boolean;
  method: 'token_gate' | 'code' | 'admin' | null;
  expiresAt: string | null;
}

export interface CodeRedeemResponse {
  access: 'granted' | 'invalid' | 'expired' | 'already_used';
  expiresAt: string | null;
}

// ── Leaderboard ──
export interface LeaderboardEntry {
  rank: number;
  previousRank: number | null;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  edgeScore: number;
  winRate: number;
  trades: number;
  strongestCategory: string | null;
  momentum: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalUsers: number;
  nextCursor: string | null;
}
