import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

type UserStats = {
  edgeScore: number;
  percentileGlobal: number;
  resolvedCount: number;
  tradeCount: number;
  winRate: number;
  winStreakCurrent: number;
  winStreakBest: number;
  totalPnl: number;
  categoriesTraded: number;
  categoryStats: Array<{ category: string | null; trade_count: number | null; win_rate: number | null; roi: number | null }>;
  venuesTraded: number;
  momentum: number;
  roi: number;
  bandStats: Array<{ probability_band: string; trade_count: number | null; win_rate: number | null; calibration_error: number | null }>;
  rank: number | null;
};

export const checkAchievements = inngest.createFunction(
  { id: 'check-achievements', name: 'Check Achievement Progress' },
  [{ event: 'decision/created' }, { event: 'user/sync.completed' }, { cron: '0 4 * * *' }],
  async ({ event, step }) => {
    const supabase = createAdminClient();
    const eventData = (event as { data?: { userId?: string } } | undefined)?.data;
    const eventUserId = eventData?.userId;

    if (!eventUserId) {
      const { data: users } = await supabase
        .from('venue_accounts')
        .select('user_id')
        .eq('connection_status', 'connected');

      const uniqueUserIds = [...new Set((users ?? []).map((u) => u.user_id))];
      for (const userId of uniqueUserIds) {
        await step.run(`evaluate-${userId}`, async () => evaluateUserAchievements(supabase, userId));
      }

      return { usersProcessed: uniqueUserIds.length };
    }

    const userId = eventUserId;
    await step.run('evaluate-achievements', async () => evaluateUserAchievements(supabase, userId));

    return { userId };
  }
);

async function evaluateUserAchievements(supabase: SupabaseAdmin, userId: string) {
  const { data: achievements } = await supabase.from('achievements').select('*');
  if (!achievements) return;

  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId);

  const existingMap = new Map((userAchievements || []).map((ua) => [ua.achievement_id, ua]));
  const stats = await gatherUserStats(supabase, userId);

  for (const achievement of achievements) {
    const existing = existingMap.get(achievement.achievement_id);
    if (existing?.status === 'unlocked') continue;

    const criteria = (achievement.criteria_json as Record<string, unknown>) || {};
    const { progress, met } = evaluateCriteria(criteria, stats);

    if (met && existing?.status !== 'unlocked') {
      await supabase.from('user_achievements').upsert(
        {
          user_id: userId,
          achievement_id: achievement.achievement_id,
          status: 'unlocked',
          progress_current: progress.current,
          progress_target: progress.target,
          unlocked_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,achievement_id' }
      );
    } else if (progress.current > 0) {
      await supabase.from('user_achievements').upsert(
        {
          user_id: userId,
          achievement_id: achievement.achievement_id,
          status: progress.current > 0 ? 'in_progress' : 'locked',
          progress_current: progress.current,
          progress_target: progress.target,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,achievement_id' }
      );
    }
  }
}

async function gatherUserStats(supabase: SupabaseAdmin, userId: string): Promise<UserStats> {
  const [
    rating,
    trades,
    decisions,
    positions,
    categories,
    streaks,
    metrics,
    bandStats,
    leaderboard,
  ] = await Promise.all([
    supabase.from('user_rating_state').select('*').eq('user_id', userId).single(),
    supabase.from('trades').select('trade_id, venue_id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('decisions').select('*').eq('user_id', userId).eq('is_resolved', true),
    supabase.from('positions').select('realized_pnl, cost_basis').eq('user_id', userId).eq('status', 'closed'),
    supabase
      .from('user_category_snapshots')
      .select('category, trade_count, win_rate, roi')
      .eq('user_id', userId)
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined'),
    supabase
      .from('decisions')
      .select('actual_S, entry_ts')
      .eq('user_id', userId)
      .eq('is_resolved', true)
      .order('entry_ts', { ascending: true }),
    supabase
      .from('user_metric_snapshots')
      .select('momentum, roi')
      .eq('user_id', userId)
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined')
      .maybeSingle(),
    supabase
      .from('user_probability_band_snapshots')
      .select('probability_band, trade_count, win_rate, calibration_error')
      .eq('user_id', userId)
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined'),
    supabase.from('user_rating_state').select('user_id, edge_score').order('edge_score', { ascending: false }).limit(5000),
  ]);

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  for (const d of streaks.data || []) {
    if ((d.actual_S || 0) > 0.5) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  currentStreak = tempStreak;

  const totalPnl = (positions.data || []).reduce((s, p) => s + (p.realized_pnl || 0), 0);
  const totalCost = (positions.data || []).reduce((s, p) => s + (p.cost_basis || 0), 0);

  const categoriesTraded = new Set(
    (categories.data || []).filter((c) => (c.trade_count || 0) > 0).map((c) => c.category || '')
  );

  const resolvedDecisions = decisions.data || [];
  const wins = resolvedDecisions.filter((d) => (d.actual_S || 0) > 0.5);
  const winRate = resolvedDecisions.length > 0 ? wins.length / resolvedDecisions.length : 0;

  const venuesTraded = new Set((trades.data || []).map((t) => t.venue_id));

  const sorted = leaderboard.data || [];
  const rank = sorted.findIndex((entry) => entry.user_id === userId);

  return {
    edgeScore: rating.data?.edge_score || 50,
    percentileGlobal: rating.data?.percentile_global || 0,
    resolvedCount: resolvedDecisions.length,
    tradeCount: trades.count || 0,
    winRate,
    winStreakCurrent: currentStreak,
    winStreakBest: bestStreak,
    totalPnl,
    categoriesTraded: categoriesTraded.size,
    categoryStats: categories.data || [],
    venuesTraded: venuesTraded.size,
    momentum: metrics.data?.momentum || 50,
    roi: totalCost > 0 ? totalPnl / totalCost : metrics.data?.roi || 0,
    bandStats: bandStats.data || [],
    rank: rank >= 0 ? rank + 1 : null,
  };
}

function evaluateCriteria(
  criteria: Record<string, unknown>,
  stats: UserStats
): { progress: { current: number; target: number }; met: boolean } {
  const type = String(criteria.type || '');
  const threshold = Number(criteria.threshold || 0);

  switch (type) {
    case 'resolved_count':
      return { progress: { current: stats.resolvedCount, target: threshold }, met: stats.resolvedCount >= threshold };
    case 'trade_count_min':
      return { progress: { current: stats.tradeCount, target: threshold }, met: stats.tradeCount >= threshold };
    case 'win_rate_min': {
      const minTrades = Number(criteria.min_trades || 0);
      const hasEnough = stats.tradeCount >= minTrades;
      return {
        progress: { current: Math.round(stats.winRate * 100), target: threshold * 100 },
        met: hasEnough && stats.winRate >= threshold,
      };
    }
    case 'edge_score_min':
      return { progress: { current: Math.round(stats.edgeScore), target: threshold }, met: stats.edgeScore >= threshold };
    case 'win_streak_min':
      return { progress: { current: stats.winStreakBest, target: threshold }, met: stats.winStreakBest >= threshold };
    case 'pnl_total_min':
      return { progress: { current: Math.round(stats.totalPnl), target: threshold }, met: stats.totalPnl >= threshold };
    case 'roi_min':
      return { progress: { current: Math.round(stats.roi * 100), target: threshold * 100 }, met: stats.roi >= threshold };
    case 'category_trades_min': {
      const category = String(criteria.category || '').toLowerCase();
      const catStat = stats.categoryStats.find((c) => (c.category || '').toLowerCase() === category);
      const catTrades = catStat?.trade_count || 0;
      return { progress: { current: catTrades, target: threshold }, met: catTrades >= threshold };
    }
    case 'category_win_rate_min': {
      const minTrades = Number(criteria.min_trades || 0);
      const bestCat = [...stats.categoryStats]
        .filter((c) => (c.trade_count || 0) >= minTrades)
        .sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0))[0];
      const bestWr = bestCat?.win_rate || 0;
      return {
        progress: { current: Math.round(bestWr * 100), target: threshold * 100 },
        met: bestWr >= threshold,
      };
    }
    case 'categories_traded_min':
      return {
        progress: { current: stats.categoriesTraded, target: threshold },
        met: stats.categoriesTraded >= threshold,
      };
    case 'percentile_min':
      return {
        progress: { current: Math.round(stats.percentileGlobal * 100), target: threshold * 100 },
        met: stats.percentileGlobal >= threshold,
      };
    case 'rank_exact':
      return { progress: { current: stats.rank || 0, target: threshold }, met: stats.rank === threshold };
    case 'follower_count_min':
      return { progress: { current: 0, target: threshold }, met: false };
    case 'momentum_min':
      return { progress: { current: Math.round(stats.momentum), target: threshold }, met: stats.momentum >= threshold };
    case 'venues_traded_min':
      return { progress: { current: stats.venuesTraded, target: threshold }, met: stats.venuesTraded >= threshold };
    case 'band_win_rate_min': {
      const minTrades = Number(criteria.min_trades || 0);
      const bestBand = [...stats.bandStats]
        .filter((b) => (b.trade_count || 0) >= minTrades)
        .sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0))[0];
      const bestWr = bestBand?.win_rate || 0;
      return {
        progress: { current: Math.round(bestWr * 100), target: threshold * 100 },
        met: bestWr >= threshold,
      };
    }
    case 'calibration_error_max': {
      const best = [...stats.bandStats]
        .filter((b) => (b.trade_count || 0) > 0)
        .sort((a, b) => (a.calibration_error || 1) - (b.calibration_error || 1))[0];
      const bestErr = best?.calibration_error ?? 1;
      return {
        progress: { current: Math.round(Math.max(0, 1 - bestErr) * 100), target: Math.round((1 - threshold) * 100) },
        met: bestErr <= threshold,
      };
    }
    default:
      return { progress: { current: 0, target: 1 }, met: false };
  }
}
