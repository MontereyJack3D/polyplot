// Market status
export type MarketStatus = 'open' | 'closed' | 'resolved' | 'cancelled';

// Position
export type PositionSide = 'YES' | 'NO';
export type PositionStatus = 'open' | 'closed' | 'resolved';

// Trade
export type TradeSide = 'YES' | 'NO';
export type TradeDirection = 'buy' | 'sell';
export type TradeStatus = 'filled' | 'partial' | 'cancelled';

// Decision
export type DecisionSide = 'YES' | 'NO';
export type ProbabilityBand = '0-20' | '20-40' | '40-60' | '60-80' | '80-100';
export type TimeToResolutionBucket = 'early' | 'mid' | 'late';

// Rating
export type RatingUpdateType = 'resolution' | 'live_estimate' | 'recalibration';

// User
export type PrivacyMode = 'private' | 'public';

// Venue
export type VenueId = 'polymarket' | 'kalshi';
export type ConnectionStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

// Engine
export type EngineRunStatus = 'running' | 'completed' | 'failed';
export type EngineRunType = 'cron' | 'event' | 'manual';
export type SignalSubjectType = 'market' | 'user' | 'mapping';
export type AnomalyType =
  | 'whale_distortion'
  | 'spoofing'
  | 'narrative_pump'
  | 'overnight_drift'
  | 'end_of_market';

// Execution
export type ExecutionPlanStatus =
  | 'created'
  | 'awaiting_approval'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'expired';
export type ExecutionEventStatus = 'pending' | 'submitted' | 'accepted' | 'filled' | 'failed';

// Achievement
export type AchievementFamily =
  | 'skill'
  | 'profit'
  | 'streak'
  | 'momentum'
  | 'specialization'
  | 'discovery'
  | 'strategy'
  | 'competitive'
  | 'longevity';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type AchievementStatus = 'locked' | 'in_progress' | 'unlocked';

// Access
export type AccessGrantMethod = 'code' | 'token_gate' | 'admin';
export type TokenGateRuleType = 'min_balance' | 'token_id_allowlist' | 'address_allowlist';

// Timeframes (used by snapshot system and filters)
export type StandardTimeframe = '7D' | '30D' | 'YTD' | '1Y' | 'ALL';
export type VenueScope = 'combined' | 'polymarket' | 'kalshi';

// App mode
export type AppMode = 'normal' | 'pro';

// Signal types from engines
export type SignalType =
  | 'probability_adjustment'
  | 'stability_score'
  | 'liquidity_score'
  | 'whale_activity'
  | 'spoofing_detected'
  | 'narrative_pump'
  | 'overnight_drift'
  | 'end_of_market'
  | 'arbitrage_opportunity'
  | 'opportunity_ranking';
