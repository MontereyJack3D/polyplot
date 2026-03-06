INSERT INTO achievements (name, family, tier, is_hidden, description, criteria_json, icon_ref) VALUES
('First Blood', 'skill', 'bronze', false, 'Resolve your first prediction', '{"type": "resolved_count", "threshold": 1}', 'target'),
('Sharp Shooter', 'skill', 'silver', false, 'Achieve a 60% win rate with 20+ trades', '{"type": "win_rate_min", "threshold": 0.60, "min_trades": 20}', 'target'),
('Precision Trader', 'skill', 'gold', false, 'Achieve a 65% win rate with 50+ trades', '{"type": "win_rate_min", "threshold": 0.65, "min_trades": 50}', 'target'),
('Edge Lord', 'skill', 'gold', false, 'Reach an Edge Score of 75', '{"type": "edge_score_min", "threshold": 75}', 'zap'),
('Oracle', 'skill', 'diamond', false, 'Reach an Edge Score of 90', '{"type": "edge_score_min", "threshold": 90}', 'sparkles'),

('Hot Streak', 'streak', 'bronze', false, 'Win 3 predictions in a row', '{"type": "win_streak_min", "threshold": 3}', 'flame'),
('On Fire', 'streak', 'silver', false, 'Win 5 predictions in a row', '{"type": "win_streak_min", "threshold": 5}', 'flame'),
('Unstoppable', 'streak', 'gold', false, 'Win 10 predictions in a row', '{"type": "win_streak_min", "threshold": 10}', 'flame'),
('Legendary Streak', 'streak', 'diamond', true, 'Win 20 predictions in a row', '{"type": "win_streak_min", "threshold": 20}', 'flame'),

('In the Green', 'profit', 'bronze', false, 'Earn $100 in realized PnL', '{"type": "pnl_total_min", "threshold": 100}', 'trending-up'),
('Four Figures', 'profit', 'silver', false, 'Earn $1,000 in realized PnL', '{"type": "pnl_total_min", "threshold": 1000}', 'trending-up'),
('Five Figures', 'profit', 'gold', false, 'Earn $10,000 in realized PnL', '{"type": "pnl_total_min", "threshold": 10000}', 'trending-up'),
('Six Figures', 'profit', 'diamond', true, 'Earn $100,000 in realized PnL', '{"type": "pnl_total_min", "threshold": 100000}', 'trending-up'),
('20% Club', 'profit', 'bronze', false, 'Reach 20% ROI', '{"type": "roi_min", "threshold": 0.20}', 'percent'),
('50% Club', 'profit', 'silver', false, 'Reach 50% ROI', '{"type": "roi_min", "threshold": 0.50}', 'percent'),
('Double Up', 'profit', 'gold', false, 'Reach 100% ROI', '{"type": "roi_min", "threshold": 1.00}', 'percent'),

('Politics Wonk', 'specialization', 'bronze', false, 'Make 10 trades in Politics', '{"type": "category_trades_min", "category": "politics", "threshold": 10}', 'landmark'),
('Crypto Degen', 'specialization', 'bronze', false, 'Make 10 trades in Crypto', '{"type": "category_trades_min", "category": "crypto", "threshold": 10}', 'bitcoin'),
('Sportsbook Sensei', 'specialization', 'bronze', false, 'Make 10 trades in Sports', '{"type": "category_trades_min", "category": "sports", "threshold": 10}', 'trophy'),
('Macro Maven', 'specialization', 'bronze', false, 'Make 10 trades in Macro', '{"type": "category_trades_min", "category": "macro", "threshold": 10}', 'globe'),
('Category Master', 'specialization', 'gold', false, 'Achieve 70% win rate in any category with 30+ trades', '{"type": "category_win_rate_min", "threshold": 0.70, "min_trades": 30}', 'award'),
('Polymath', 'specialization', 'diamond', false, 'Trade in 5+ different categories', '{"type": "categories_traded_min", "threshold": 5}', 'globe'),
('Band Specialist', 'specialization', 'silver', false, 'Achieve 70%+ win rate in any probability band with 20+ trades', '{"type": "band_win_rate_min", "threshold": 0.70, "min_trades": 20}', 'layers'),

('Newcomer', 'longevity', 'bronze', false, 'Make your first 10 trades', '{"type": "trade_count_min", "threshold": 10}', 'user'),
('Veteran', 'longevity', 'silver', false, 'Make 100 trades', '{"type": "trade_count_min", "threshold": 100}', 'shield'),
('Centurion', 'longevity', 'gold', false, 'Make 500 trades', '{"type": "trade_count_min", "threshold": 500}', 'shield'),
('Legend', 'longevity', 'diamond', true, 'Make 1000 trades', '{"type": "trade_count_min", "threshold": 1000}', 'crown'),
('Momentum Builder', 'longevity', 'bronze', false, 'Reach momentum score 70', '{"type": "momentum_min", "threshold": 70}', 'activity'),
('Momentum Breakout', 'longevity', 'silver', false, 'Reach momentum score 80', '{"type": "momentum_min", "threshold": 80}', 'activity'),
('Momentum Rocket', 'longevity', 'gold', false, 'Reach momentum score 90', '{"type": "momentum_min", "threshold": 90}', 'activity'),

('First Follower', 'competitive', 'bronze', false, 'Have 1 user follow your profile', '{"type": "follower_count_min", "threshold": 1}', 'users'),
('Top 25%', 'competitive', 'bronze', false, 'Reach the top 25% on the global leaderboard', '{"type": "percentile_min", "threshold": 0.75}', 'trophy'),
('Top 10%', 'competitive', 'silver', false, 'Reach the top 10% on the global leaderboard', '{"type": "percentile_min", "threshold": 0.90}', 'trophy'),
('Top 1%', 'competitive', 'gold', false, 'Reach the top 1% on the global leaderboard', '{"type": "percentile_min", "threshold": 0.99}', 'trophy'),
('Number One', 'competitive', 'diamond', true, 'Reach #1 on the global leaderboard', '{"type": "rank_exact", "threshold": 1}', 'crown'),
('Cross-Venue Trader', 'competitive', 'silver', false, 'Trade on 2+ venues', '{"type": "venues_traded_min", "threshold": 2}', 'arrow-left-right'),
('Calibration Artist', 'competitive', 'gold', false, 'Achieve calibration error < 0.05 in any probability band', '{"type": "calibration_error_max", "threshold": 0.05}', 'compass')
ON CONFLICT DO NOTHING;
