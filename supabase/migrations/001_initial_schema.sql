-- PolyPlot schema v1 (Postgres)
create extension if not exists "pgcrypto";

create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  display_name text,
  avatar_url text,
  privacy_mode text not null default 'private',
  default_timeframe text not null default '30D',
  default_venue_view text not null default 'combined',
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists venues (
  venue_id text primary key,
  name text not null,
  brand_color text,
  fee_model_json jsonb not null default '{}'::jsonb,
  supports_trading boolean not null default false,
  supports_orderbook boolean not null default false
);

create table if not exists venue_accounts (
  venue_account_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  venue_id text not null references venues(venue_id),
  external_account_ref text not null,
  account_label text,
  connection_status text not null default 'connected',
  permissions jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  unique (user_id, venue_id)
);

create table if not exists tax_categories (
  tax_category_id uuid primary key default gen_random_uuid(),
  level int not null,
  name text not null,
  slug text unique not null,
  parent_id uuid references tax_categories(tax_category_id),
  sort_order int not null default 0
);

create table if not exists venue_taxonomy_map (
  map_id uuid primary key default gen_random_uuid(),
  venue_id text not null references venues(venue_id),
  venue_category_raw text not null,
  venue_subcategory_raw text,
  venue_subsubcategory_raw text,
  tax_category_id uuid not null references tax_categories(tax_category_id),
  confidence double precision not null default 1.0,
  mapped_by text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists markets (
  market_id uuid primary key default gen_random_uuid(),
  venue_id text not null references venues(venue_id),
  venue_market_id text not null,
  question text not null,
  description text,
  category_raw text,
  subcategory_raw text,
  subsubcategory_raw text,
  tax_category_id uuid references tax_categories(tax_category_id),
  tags text[] default '{}',
  start_time timestamptz,
  end_time timestamptz,
  status text not null default 'open',
  fee_bps integer,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, venue_market_id)
);

create table if not exists market_mapping (
  mapping_id uuid primary key default gen_random_uuid(),
  canonical_event_key text not null,
  market_id_a uuid not null references markets(market_id),
  market_id_b uuid not null references markets(market_id),
  match_confidence double precision not null,
  matched_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists market_prices (
  market_price_id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(market_id),
  ts timestamptz not null,
  mid_prob double precision,
  best_bid_prob double precision,
  best_ask_prob double precision,
  spread double precision,
  volume_24h double precision,
  liquidity_score double precision,
  stability_score double precision,
  source text not null default 'venue'
);
create index if not exists idx_market_prices_market_ts on market_prices(market_id, ts desc);

create table if not exists trades (
  trade_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  venue_id text not null references venues(venue_id),
  market_id uuid not null references markets(market_id),
  ts timestamptz not null,
  side text not null,
  direction text not null,
  quantity double precision not null,
  price_prob double precision not null,
  fee_paid double precision default 0,
  tx_ref text,
  order_ref text,
  status text not null default 'filled',
  raw_ref_id text
);
create index if not exists idx_trades_user_ts on trades(user_id, ts desc);

create table if not exists positions (
  position_id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  venue_id text not null references venues(venue_id),
  market_id uuid not null references markets(market_id),
  position_side text not null,
  status text not null default 'open',
  opened_at timestamptz,
  closed_at timestamptz,
  resolved_at timestamptz,
  net_quantity double precision not null default 0,
  avg_entry_prob double precision,
  avg_exit_prob double precision,
  cost_basis double precision,
  current_value double precision,
  realized_pnl double precision default 0,
  unrealized_pnl double precision default 0,
  roi_realized double precision,
  roi_total double precision,
  last_mark_prob double precision,
  last_mark_ts timestamptz
);
create index if not exists idx_positions_user_status on positions(user_id, status);

create table if not exists venue_balances (
  venue_balance_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  venue_id text not null references venues(venue_id),
  ts timestamptz not null default now(),
  total_balance double precision not null,
  used_balance double precision not null,
  available_balance double precision not null,
  pnl_24h double precision,
  pnl_24h_pct double precision,
  source text not null default 'venue'
);
create index if not exists idx_venue_balances_user_ts on venue_balances(user_id, ts desc);

create table if not exists resolutions (
  resolution_id uuid primary key default gen_random_uuid(),
  market_id uuid not null unique references markets(market_id),
  resolved_at timestamptz not null,
  outcome text not null,
  settlement_prob double precision not null,
  resolution_source text
);

create table if not exists decisions (
  decision_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  venue_id text not null references venues(venue_id),
  market_id uuid not null references markets(market_id),
  position_id uuid references positions(position_id),
  entry_ts timestamptz not null,
  exit_ts timestamptz,
  resolved_ts timestamptz,
  side text not null,
  p_in double precision not null,
  p_out double precision,
  y integer,
  is_resolved boolean not null default false,
  is_early_exit boolean not null default false,
  expected_E double precision,
  actual_S double precision,
  log_loss double precision,
  capture double precision,
  weight_size double precision,
  weight_reliability double precision,
  weight_final double precision,
  rating_delta_final double precision,
  rating_delta_live double precision,
  probability_band text,
  time_to_resolution_bucket text
);
create index if not exists idx_decisions_user_entry_ts on decisions(user_id, entry_ts desc);

create table if not exists rating_events (
  rating_event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  decision_id uuid references decisions(decision_id),
  ts timestamptz not null,
  update_type text not null,
  r_before double precision not null,
  r_after double precision not null,
  delta double precision not null,
  components_json jsonb not null default '{}'::jsonb
);
create index if not exists idx_rating_events_user_ts on rating_events(user_id, ts desc);

create table if not exists user_rating_state (
  user_id uuid primary key references users(user_id),
  rating_r double precision not null default 1500,
  edge_score double precision not null default 50,
  resolved_decision_count integer not null default 0,
  reliability_factor double precision not null default 0,
  percentile_global double precision,
  percentile_by_category jsonb not null default '{}'::jsonb,
  last_updated_at timestamptz not null default now()
);

create table if not exists user_metric_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  timeframe_key text not null,
  venue_scope text not null,
  start_date date not null,
  end_date date not null,
  is_custom boolean not null default false,
  custom_key text,
  expires_at timestamptz,
  trade_count integer not null default 0,
  win_rate double precision,
  roi double precision,
  pnl_total double precision,
  pnl_realized double precision,
  momentum double precision,
  win_streak_current integer,
  win_streak_best integer,
  active_markets_count integer,
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_user_metric_snapshots_unique
  on user_metric_snapshots (user_id, timeframe_key, venue_scope, coalesce(custom_key,''));

create table if not exists user_category_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  timeframe_key text not null,
  venue_scope text not null,
  category text not null,
  subcategory text,
  subsubcategory text,
  is_custom boolean not null default false,
  custom_key text,
  trade_count integer not null default 0,
  win_rate double precision,
  roi double precision,
  pnl_total double precision,
  edge_contribution double precision,
  momentum_contribution double precision,
  updated_at timestamptz not null default now()
);

create table if not exists user_probability_band_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  timeframe_key text not null,
  venue_scope text not null,
  category text,
  probability_band text not null,
  is_custom boolean not null default false,
  custom_key text,
  trade_count integer not null default 0,
  win_rate double precision,
  roi double precision,
  pnl_total double precision,
  log_loss_avg double precision,
  calibration_error double precision,
  edge_contribution double precision,
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_user_probability_band_snapshots_unique
  on user_probability_band_snapshots (user_id, timeframe_key, venue_scope, coalesce(category,''), probability_band, coalesce(custom_key,''));

create table if not exists engine_runs (
  run_id uuid primary key default gen_random_uuid(),
  engine_name text not null,
  run_type text not null,
  ts_start timestamptz not null,
  ts_end timestamptz,
  status text not null,
  config_json jsonb not null default '{}'::jsonb,
  version text
);

create table if not exists engine_signals (
  signal_id uuid primary key default gen_random_uuid(),
  run_id uuid references engine_runs(run_id),
  engine_name text not null,
  signal_type text not null,
  subject_type text not null,
  subject_id text not null,
  value_float double precision,
  value_json jsonb not null default '{}'::jsonb,
  severity integer not null default 0,
  ts timestamptz not null default now()
);

create table if not exists opportunity_rankings (
  opp_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  market_id uuid not null references markets(market_id),
  ts timestamptz not null default now(),
  opportunity_score double precision not null,
  components_json jsonb not null default '{}'::jsonb,
  explanation_text text,
  recommended_action text,
  run_id uuid references engine_runs(run_id)
);

create table if not exists anomaly_events (
  anomaly_id uuid primary key default gen_random_uuid(),
  market_id uuid not null references markets(market_id),
  ts timestamptz not null default now(),
  anomaly_type text not null,
  severity integer not null default 0,
  description text,
  evidence_json jsonb not null default '{}'::jsonb,
  run_id uuid references engine_runs(run_id)
);

create table if not exists arbitrage_opportunities (
  arb_id uuid primary key default gen_random_uuid(),
  mapping_id uuid references market_mapping(mapping_id),
  ts timestamptz not null default now(),
  market_id_polymarket uuid references markets(market_id),
  market_id_kalshi uuid references markets(market_id),
  prob_polymarket double precision,
  prob_kalshi double precision,
  spread double precision,
  expected_profit_bps double precision,
  liquidity_ok boolean,
  execution_confidence double precision,
  recommended_size double precision,
  status text not null default 'active',
  run_id uuid references engine_runs(run_id)
);

create table if not exists execution_plans (
  plan_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  mapping_id uuid references market_mapping(mapping_id),
  ts_created timestamptz not null default now(),
  plan_type text not null,
  legs_json jsonb not null,
  estimated_profit_bps double precision,
  max_slippage_bps double precision,
  expires_at timestamptz,
  status text not null default 'created',
  signed_intent_ref text,
  idempotency_key text
);

create table if not exists execution_events (
  exec_event_id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references execution_plans(plan_id),
  ts timestamptz not null default now(),
  step_index int not null,
  venue_id text not null references venues(venue_id),
  status text not null,
  tx_ref text,
  error_json jsonb not null default '{}'::jsonb
);

create table if not exists achievements (
  achievement_id uuid primary key default gen_random_uuid(),
  name text not null,
  family text not null,
  tier text not null,
  is_hidden boolean not null default false,
  description text not null,
  criteria_json jsonb not null default '{}'::jsonb,
  icon_ref text
);

create table if not exists user_achievements (
  user_id uuid not null references users(user_id),
  achievement_id uuid not null references achievements(achievement_id),
  status text not null default 'locked',
  progress_current double precision not null default 0,
  progress_target double precision not null default 1,
  unlocked_at timestamptz,
  last_updated_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists access_codes (
  code_id uuid primary key default gen_random_uuid(),
  code_hash text unique not null,
  access_duration_days int,
  is_single_use boolean not null default true,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by_user_id uuid references users(user_id)
);

create table if not exists access_grants (
  grant_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  granted_by text not null default 'code',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_access_grants_user on access_grants(user_id, expires_at);

create table if not exists token_gate_rules (
  rule_id uuid primary key default gen_random_uuid(),
  chain_id int not null,
  contract_address text not null,
  rule_type text not null,
  rule_params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists token_gate_checks (
  check_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(user_id),
  rule_id uuid not null references token_gate_rules(rule_id),
  checked_at timestamptz not null default now(),
  eligible boolean not null,
  evidence_json jsonb not null default '{}'::jsonb
);
