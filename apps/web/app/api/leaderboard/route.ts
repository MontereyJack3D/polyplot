import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? '50');
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50;
}

function parseCursor(value: string | null): number {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function ratingToEdgeScore(r: number): number {
  return 100 / (1 + Math.exp(-(r - 1500) / 250));
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseLimit(searchParams.get('limit'));
  const cursor = parseCursor(searchParams.get('cursor'));

  const { data: strongest } = await supabase
    .from('user_category_snapshots')
    .select('user_id,category,edge_contribution')
    .eq('timeframe_key', 'ALL')
    .eq('venue_scope', 'combined')
    .order('edge_contribution', { ascending: false });

  const strongestCategory = new Map<string, string>();
  for (const row of strongest ?? []) {
    if (!strongestCategory.has(row.user_id)) strongestCategory.set(row.user_id, row.category);
  }

  let userIds: string[] | null = null;
  if (category && category !== 'All') {
    userIds = (strongest ?? []).filter((r) => r.category === category).map((r) => r.user_id);
    if (userIds.length === 0) {
      return NextResponse.json({ entries: [], totalUsers: 0, nextCursor: null });
    }
  }

  let ratingsQuery = supabase
    .from('user_rating_state')
    .select('user_id,edge_score,percentile_global,resolved_decision_count,users!inner(handle,display_name,avatar_url)', { count: 'exact' })
    .order('edge_score', { ascending: false });

  if (userIds) ratingsQuery = ratingsQuery.in('user_id', userIds);

  const { data: ratings, count, error } = await ratingsQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allUserIds = (ratings ?? []).map((row) => row.user_id);
  const [{ data: metrics }, { data: categoryRows }, { data: lastEvents }, { data: trendEvents }] = await Promise.all([
    supabase
      .from('user_metric_snapshots')
      .select('user_id,win_rate,momentum')
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined')
      .in('user_id', allUserIds),
    supabase
      .from('user_category_snapshots')
      .select('user_id,category,trade_count')
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined')
      .in('user_id', allUserIds),
    supabase
      .from('rating_events')
      .select('user_id,delta,ts')
      .in('user_id', allUserIds)
      .order('ts', { ascending: false }),
    supabase
      .from('rating_events')
      .select('user_id,r_after,ts')
      .in('user_id', allUserIds)
      .order('ts', { ascending: false })
      .limit(1000),
  ]);

  const metricMap = new Map<string, { winRate: number; momentum: number }>();
  for (const row of metrics ?? []) {
    if (!metricMap.has(row.user_id)) {
      metricMap.set(row.user_id, {
        winRate: row.win_rate ?? 0,
        momentum: row.momentum ?? 50,
      });
    }
  }

  const tradesByUser = new Map<string, number>();
  for (const row of categoryRows ?? []) {
    tradesByUser.set(row.user_id, (tradesByUser.get(row.user_id) ?? 0) + (row.trade_count ?? 0));
  }

  const latestDeltaByUser = new Map<string, number>();
  for (const row of lastEvents ?? []) {
    if (!latestDeltaByUser.has(row.user_id)) latestDeltaByUser.set(row.user_id, row.delta ?? 0);
  }

  const previousScoreByUser = new Map<string, number>();
  for (const row of ratings ?? []) {
    previousScoreByUser.set(row.user_id, (row.edge_score ?? 0) - (latestDeltaByUser.get(row.user_id) ?? 0));
  }

  const currentOrder = [...(ratings ?? [])]
    .sort((a, b) => (b.edge_score ?? 0) - (a.edge_score ?? 0))
    .map((row) => row.user_id);
  const previousOrder = [...(ratings ?? [])]
    .sort((a, b) => (previousScoreByUser.get(b.user_id) ?? 0) - (previousScoreByUser.get(a.user_id) ?? 0))
    .map((row) => row.user_id);

  const previousRankByUser = new Map<string, number>();
  previousOrder.forEach((userId, idx) => {
    previousRankByUser.set(userId, idx + 1);
  });

  const paged = (ratings ?? []).slice(cursor, cursor + limit);

  const trendsByUser = new Map<string, number[]>();
  for (const row of trendEvents ?? []) {
    const edgeValue = ratingToEdgeScore(row.r_after ?? 1500);
    const existing = trendsByUser.get(row.user_id) ?? [];
    existing.push(Math.round(edgeValue * 10) / 10);
    trendsByUser.set(row.user_id, existing);
  }

  const entries = paged.map((row) => {
    const userData = Array.isArray(row.users) ? row.users[0] : row.users;
    const metricsForUser = metricMap.get(row.user_id);
    const rank = currentOrder.indexOf(row.user_id) + 1;

    return {
      rank,
      previousRank: previousRankByUser.get(row.user_id) ?? null,
      handle: userData?.handle ?? 'unknown',
      displayName: userData?.display_name ?? null,
      avatarUrl: userData?.avatar_url ?? null,
      edgeScore: row.edge_score ?? 0,
      percentile: row.percentile_global ?? (currentOrder.length > 0 ? 1 - (rank - 1) / currentOrder.length : null),
      winRate: metricsForUser?.winRate ?? 0,
      trades: tradesByUser.get(row.user_id) ?? row.resolved_decision_count ?? 0,
      strongestCategory: strongestCategory.get(row.user_id) ?? null,
      momentum: metricsForUser?.momentum ?? 50,
      rankSparkline: (trendsByUser.get(row.user_id) ?? [row.edge_score ?? 50]).slice(0, 10).reverse(),
    };
  });

  const nextCursor = count && cursor + limit < count ? String(cursor + limit) : null;

  return NextResponse.json({
    entries,
    totalUsers: count ?? entries.length,
    nextCursor,
  });
}
