-- Seed venues
INSERT INTO venues (venue_id, name, brand_color, supports_trading, supports_orderbook, fee_model_json) VALUES
  ('polymarket', 'Polymarket', '#00d4aa', true, true, '{"maker_bps": 0, "taker_bps": 0}'),
  ('kalshi', 'Kalshi', '#00b389', true, false, '{"maker_bps": 0, "taker_bps": 700}')
ON CONFLICT (venue_id) DO NOTHING;

-- Seed top-level taxonomy categories
INSERT INTO tax_categories (level, name, slug, sort_order) VALUES
  (0, 'Politics', 'politics', 1),
  (0, 'Sports', 'sports', 2),
  (0, 'Crypto', 'crypto', 3),
  (0, 'Macro', 'macro', 4),
  (0, 'Finance', 'finance', 5),
  (0, 'Tech', 'tech', 6),
  (0, 'Culture', 'culture', 7),
  (0, 'Science', 'science', 8),
  (0, 'World', 'world', 9),
  (0, 'Other', 'other', 10)
ON CONFLICT (slug) DO NOTHING;

-- Seed test access codes (hash of 'ALPHA-2025' and 'BETA-TEST')
-- Generate with: echo -n 'ALPHA-2025' | sha256sum
INSERT INTO access_codes (code_hash, access_duration_days, is_single_use) VALUES
  (encode(sha256('ALPHA-2025'), 'hex'), NULL, false),  -- permanent, reusable
  (encode(sha256('BETA-TEST'), 'hex'), 30, true)       -- 30 days, single use
ON CONFLICT DO NOTHING;
