import { NextRequest, NextResponse } from 'next/server';

import { findUserByWalletAddress, getSessionWalletAddress } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PRIVATE_FIELDS = ['pnlTotal', 'pnlRealized', 'pnl24h', 'totalBalance'] as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createServerSupabaseClient();
  const walletAddress = await getSessionWalletAddress();
  const requester = walletAddress ? await findUserByWalletAddress(walletAddress) : null;
  const targetUserId = handle === 'me' ? requester?.user_id : undefined;
  if (handle === 'me' && !requester?.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = targetUserId
    ? await supabase.from('users').select('*').eq('user_id', targetUserId).single()
    : await supabase.from('users').select('*').eq('handle', handle).single();

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: rating }, { data: snapshot }, { data: categories }] = await Promise.all([
    supabase.from('user_rating_state').select('*').eq('user_id', profile.user_id).single(),
    supabase
      .from('user_metric_snapshots')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('user_category_snapshots')
      .select('category,edge_contribution')
      .eq('user_id', profile.user_id)
      .eq('timeframe_key', 'ALL')
      .eq('venue_scope', 'combined')
      .order('edge_contribution', { ascending: false })
      .limit(1),
  ]);

  const response: Record<string, unknown> = {
    userId: profile.user_id,
    handle: profile.handle,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    edgeScore: rating?.edge_score ?? 50,
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
  };

  const isOwner = requester?.user_id === profile.user_id;

  if (!isOwner && profile.privacy_mode === 'private') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!isOwner) {
    for (const field of PRIVATE_FIELDS) {
      delete response[field];
    }
  }

  return NextResponse.json(response);
}
