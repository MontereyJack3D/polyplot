import type {
  AccessGrantMethod,
  AchievementFamily,
  AchievementStatus,
  AchievementTier,
  AnomalyType,
  ConnectionStatus,
  DecisionSide,
  EngineRunStatus,
  EngineRunType,
  ExecutionEventStatus,
  ExecutionPlanStatus,
  MarketStatus,
  PositionSide,
  PositionStatus,
  PrivacyMode,
  ProbabilityBand,
  RatingUpdateType,
  SignalSubjectType,
  SignalType,
  StandardTimeframe,
  TimeToResolutionBucket,
  TokenGateRuleType,
  TradeDirection,
  TradeSide,
  TradeStatus,
  VenueId,
  VenueScope,
} from './enums';

// ── Branded ID types ──
type Brand<T, B> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type MarketId = Brand<string, 'MarketId'>;
export type TradeId = Brand<string, 'TradeId'>;
export type PositionId = Brand<string, 'PositionId'>;
export type DecisionId = Brand<string, 'DecisionId'>;
export type VenueAccountId = Brand<string, 'VenueAccountId'>;
export type MappingId = Brand<string, 'MappingId'>;
export type AchievementId = Brand<string, 'AchievementId'>;

// ── User ──
export interface User {
  userId: UserId;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  privacyMode: PrivacyMode;
  defaultTimeframe: string;
  defaultVenueView: string;
  settingsJson: Record<string, unknown>;
  createdAt: string;
}

// ── Venue ──
export interface Venue {
  venueId: VenueId;
  name: string;
  brandColor: string | null;
  feeModelJson: Record<string, unknown>;
  supportsTrading: boolean;
  supportsOrderbook: boolean;
}

// ── Venue Account ──
export interface VenueAccount {
  venueAccountId: VenueAccountId;
  userId: UserId;
  venueId: VenueId;
  externalAccountRef: string;
  accountLabel: string | null;
  connectionStatus: ConnectionStatus;
  permissions: Record<string, unknown>;
  connectedAt: string;
  lastSyncAt: string | null;
}

// ── Market ──
export interface Market {
  marketId: MarketId;
  venueId: VenueId;
  venueMarketId: string;
  question: string;
  description: string | null;
  categoryRaw: string | null;
  subcategoryRaw: string | null;
  subsubcategoryRaw: string | null;
  taxCategoryId: string | null;
  tags: string[];
  startTime: string | null;
  endTime: string | null;
  status: MarketStatus;
  feeBps: number | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Market Price ──
export interface MarketPrice {
  marketPriceId: string;
  marketId: MarketId;
  ts: string;
  midProb: number | null;
  bestBidProb: number | null;
  bestAskProb: number | null;
  spread: number | null;
  volume24h: number | null;
  liquidityScore: number | null;
  stabilityScore: number | null;
  source: string;
}

// ── Trade ──
export interface Trade {
  tradeId: TradeId;
  userId: UserId;
  venueId: VenueId;
  marketId: MarketId;
  ts: string;
  side: TradeSide;
  direction: TradeDirection;
  quantity: number;
  priceProb: number;
  feePaid: number;
  txRef: string | null;
  orderRef: string | null;
  status: TradeStatus;
  rawRefId: string | null;
}

// ── Position ──
export interface Position {
  positionId: PositionId;
  cycleId: string;
  userId: UserId;
  venueId: VenueId;
  marketId: MarketId;
  positionSide: PositionSide;
  status: PositionStatus;
  openedAt: string | null;
  closedAt: string | null;
  resolvedAt: string | null;
  netQuantity: number;
  avgEntryProb: number | null;
  avgExitProb: number | null;
  costBasis: number | null;
  currentValue: number | null;
  realizedPnl: number;
  unrealizedPnl: number;
  roiRealized: number | null;
  roiTotal: number | null;
  lastMarkProb: number | null;
  lastMarkTs: string | null;
}

// ── Resolution ──
export interface Resolution {
  resolutionId: string;
  marketId: MarketId;
  resolvedAt: string;
  outcome: string;
  settlementProb: number;
  resolutionSource: string | null;
}

// ── Decision ──
export interface Decision {
  decisionId: DecisionId;
  userId: UserId;
  venueId: VenueId;
  marketId: MarketId;
  positionId: PositionId | null;
  entryTs: string;
  exitTs: string | null;
  resolvedTs: string | null;
  side: DecisionSide;
  pIn: number;
  pOut: number | null;
  y: number | null;
  isResolved: boolean;
  isEarlyExit: boolean;
  expectedE: number | null;
  actualS: number | null;
  logLoss: number | null;
  capture: number | null;
  weightSize: number | null;
  weightReliability: number | null;
  weightFinal: number | null;
  ratingDeltaFinal: number | null;
  ratingDeltaLive: number | null;
  probabilityBand: ProbabilityBand | null;
  timeToResolutionBucket: TimeToResolutionBucket | null;
}

// ── Rating ──
export interface RatingEvent {
  ratingEventId: string;
  userId: UserId;
  decisionId: DecisionId | null;
  ts: string;
  updateType: RatingUpdateType;
  rBefore: number;
  rAfter: number;
  delta: number;
  componentsJson: Record<string, unknown>;
}

export interface UserRatingState {
  userId: UserId;
  ratingR: number;
  edgeScore: number;
  resolvedDecisionCount: number;
  reliabilityFactor: number;
  percentileGlobal: number | null;
  percentileByCategory: Record<string, number>;
  lastUpdatedAt: string;
}

// ── Snapshots ──
export interface UserMetricSnapshot {
  snapshotId: string;
  userId: UserId;
  timeframeKey: string;
  venueScope: VenueScope;
  startDate: string;
  endDate: string;
  isCustom: boolean;
  customKey: string | null;
  expiresAt: string | null;
  tradeCount: number;
  winRate: number | null;
  roi: number | null;
  pnlTotal: number | null;
  pnlRealized: number | null;
  momentum: number | null;
  winStreakCurrent: number | null;
  winStreakBest: number | null;
  activeMarketsCount: number | null;
  updatedAt: string;
}

export interface UserCategorySnapshot {
  snapshotId: string;
  userId: UserId;
  timeframeKey: string;
  venueScope: VenueScope;
  category: string;
  subcategory: string | null;
  subsubcategory: string | null;
  isCustom: boolean;
  customKey: string | null;
  tradeCount: number;
  winRate: number | null;
  roi: number | null;
  pnlTotal: number | null;
  edgeContribution: number | null;
  momentumContribution: number | null;
  updatedAt: string;
}

export interface UserProbabilityBandSnapshot {
  snapshotId: string;
  userId: UserId;
  timeframeKey: string;
  venueScope: VenueScope;
  category: string | null;
  probabilityBand: ProbabilityBand;
  isCustom: boolean;
  customKey: string | null;
  tradeCount: number;
  winRate: number | null;
  roi: number | null;
  pnlTotal: number | null;
  logLossAvg: number | null;
  calibrationError: number | null;
  edgeContribution: number | null;
  updatedAt: string;
}

// ── Engine ──
export interface EngineRun {
  runId: string;
  engineName: string;
  runType: EngineRunType;
  tsStart: string;
  tsEnd: string | null;
  status: EngineRunStatus;
  configJson: Record<string, unknown>;
  version: string | null;
}

export interface EngineSignal {
  signalId: string;
  runId: string | null;
  engineName: string;
  signalType: SignalType;
  subjectType: SignalSubjectType;
  subjectId: string;
  valueFloat: number | null;
  valueJson: Record<string, unknown>;
  severity: number;
  ts: string;
}

export interface OpportunityRanking {
  oppId: string;
  userId: UserId;
  marketId: MarketId;
  ts: string;
  opportunityScore: number;
  componentsJson: Record<string, unknown>;
  explanationText: string | null;
  recommendedAction: string | null;
  runId: string | null;
}

export interface ArbitrageOpportunity {
  arbId: string;
  mappingId: MappingId | null;
  ts: string;
  marketIdPolymarket: MarketId | null;
  marketIdKalshi: MarketId | null;
  probPolymarket: number | null;
  probKalshi: number | null;
  spread: number | null;
  expectedProfitBps: number | null;
  liquidityOk: boolean | null;
  executionConfidence: number | null;
  recommendedSize: number | null;
  status: string;
  runId: string | null;
}

// ── Achievement ──
export interface Achievement {
  achievementId: AchievementId;
  name: string;
  family: AchievementFamily;
  tier: AchievementTier;
  isHidden: boolean;
  description: string;
  criteriaJson: Record<string, unknown>;
  iconRef: string | null;
}

export interface UserAchievement {
  userId: UserId;
  achievementId: AchievementId;
  status: AchievementStatus;
  progressCurrent: number;
  progressTarget: number;
  unlockedAt: string | null;
  lastUpdatedAt: string;
}

// ── Venue Balance ──
export interface VenueBalance {
  venueBalanceId: string;
  userId: UserId;
  venueId: VenueId;
  ts: string;
  totalBalance: number;
  usedBalance: number;
  availableBalance: number;
  pnl24h: number | null;
  pnl24hPct: number | null;
  source: string;
}

// ── Access ──
export interface AccessGrant {
  grantId: string;
  userId: UserId;
  grantedBy: AccessGrantMethod;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
}

// Keep imported enum types referenced in this file's module surface for future extensions.
export type _ReservedEntityEnumReferences = {
  anomalyType?: AnomalyType;
  executionPlanStatus?: ExecutionPlanStatus;
  executionEventStatus?: ExecutionEventStatus;
  tokenGateRuleType?: TokenGateRuleType;
  standardTimeframe?: StandardTimeframe;
};
