import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'ALL';
  const venue = searchParams.get('venue') || 'combined';

  const [{ data: profile }, { data: rating }, { data: snapshot }, { data: categories }] = await Promise.all([
    supabase.from('users').select('*').eq('user_id', user.id).single(),
    supabase.from('user_rating_state').select('*').eq('user_id', user.id).single(),
    supabase
      .from('user_metric_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .eq('timeframe_key', timeframe)
      .eq('venue_scope', venue)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_category_snapshots')
      .select('category,edge_contribution')
      .eq('user_id', user.id)
      .eq('timeframe_key', timeframe)
      .eq('venue_scope', venue)
      .order('edge_contribution', { ascending: false })
      .limit(1),
  ]);

  return NextResponse.json({
    userId: user.id,
    handle: profile?.handle ?? 'unknown',
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    privacyMode: profile?.privacy_mode ?? 'private',
    edgeScore: rating?.edge_score ?? 50,
    ratingR: rating?.rating_r ?? 1500,
    percentile: rating?.percentile_global ?? 0.5,
    winRate: snapshot?.win_rate ?? 0,
    roi: snapshot?.roi ?? 0,
    pnlTotal: snapshot?.pnl_total ?? 0,
    pnlRealized: snapshot?.pnl_realized ?? 0,
    pnl24h: 0,
    totalTrades: snapshot?.trade_count ?? 0,
    activeMarketsCount: snapshot?.active_markets_count ?? 0,
    winStreakCurrent: snapshot?.win_streak_current ?? 0,
    winStreakBest: snapshot?.win_streak_best ?? 0,
    momentum: snapshot?.momentum ?? 50,
    strongestCategory: categories?.[0]?.category ?? null,
    totalBalance: null,
    timeframe,
    venue,
  });
}
