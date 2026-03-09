import { NextRequest, NextResponse } from 'next/server';

import { findUserByWalletAddress, getSessionWalletAddress } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'ALL';
  const venue = searchParams.get('venue') || 'combined';
  const walletAddress = await getSessionWalletAddress();
  const requester = walletAddress ? await findUserByWalletAddress(walletAddress) : null;
  if (handle === 'me' && !requester?.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = handle === 'me'
    ? await supabase.from('users').select('*').eq('user_id', requester?.user_id).single()
    : await supabase.from('users').select('*').eq('handle', handle).single();

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isOwner = requester?.user_id === profile.user_id;
  if (!isOwner && profile.privacy_mode === 'private') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [{ data: categories }, { data: bands }] = await Promise.all([
    supabase
      .from('user_category_snapshots')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('timeframe_key', timeframe)
      .eq('venue_scope', venue)
      .order('edge_contribution', { ascending: false }),
    supabase
      .from('user_probability_band_snapshots')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('timeframe_key', timeframe)
      .eq('venue_scope', venue)
      .order('probability_band', { ascending: true }),
  ]);

  return NextResponse.json({
    categoryEdge: (categories ?? []).map((row) => ({
      category: row.category,
      edge: row.edge_contribution ?? 0,
      winRate: row.win_rate ?? 0,
      trades: row.trade_count ?? 0,
      roi: row.roi ?? 0,
    })),
    probabilityBands: (bands ?? []).map((row) => ({
      band: row.probability_band,
      edgeContribution: row.edge_contribution ?? 0,
      winRate: row.win_rate ?? 0,
      trades: row.trade_count ?? 0,
      calibrationError: row.calibration_error ?? 0,
    })),
    venueEdge: [],
    timeHorizonEdge: [],
  });
}
