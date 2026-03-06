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

  const { data: ratingState } = await supabase
    .from('user_rating_state')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: snapshot } = await supabase
    .from('user_metric_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .eq('timeframe_key', timeframe)
    .eq('venue_scope', venue)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    timeframe,
    venue,
    edgeScore: ratingState?.edge_score ?? 50,
    edgePercentile: ratingState?.percentile_global ?? 0.5,
    momentum: snapshot?.momentum ?? 50,
    winRate: snapshot?.win_rate ?? 0,
    roi: snapshot?.roi ?? 0,
    pnlTotal: snapshot?.pnl_total ?? 0,
    pnlRealized: snapshot?.pnl_realized ?? 0,
    winStreakCurrent: snapshot?.win_streak_current ?? 0,
    winStreakBest: snapshot?.win_streak_best ?? 0,
    activeMarketsCount: snapshot?.active_markets_count ?? 0,
  });
}
