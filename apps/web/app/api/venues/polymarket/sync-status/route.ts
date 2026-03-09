import { NextResponse } from 'next/server';

import { requireSessionUser } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  let sessionUser: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    sessionUser = await requireSessionUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = sessionUser.user.user_id;

  const { data: account } = await supabase
    .from('venue_accounts')
    .select('connection_status,last_sync_at')
    .eq('user_id', userId)
    .eq('venue_id', 'polymarket')
    .single();

  if (!account) return NextResponse.json({ status: 'not_connected' });

  const [trades, positions, decisions, rating] = await Promise.all([
    supabase.from('trades').select('trade_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('positions').select('position_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('decisions').select('decision_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('user_rating_state')
      .select('edge_score,resolved_decision_count')
      .eq('user_id', userId)
      .single(),
  ]);

  const isConnected = account.connection_status === 'connected';
  const hasSyncedAtLeastOnce = !!account.last_sync_at;
  const tradesCount = trades.count || 0;
  const positionsCount = positions.count || 0;
  const resolvedCount = rating.data?.resolved_decision_count || 0;

  return NextResponse.json({
    status: account.connection_status,
    lastSyncAt: account.last_sync_at,
    progress: {
      trades: tradesCount,
      positions: positionsCount,
      decisions: decisions.count || 0,
      edgeScore: rating.data?.edge_score || 50,
      resolvedDecisions: resolvedCount,
    },
    stages: {
      marketsDiscovered: true,
      tradesImported: tradesCount > 0 || isConnected || hasSyncedAtLeastOnce,
      positionsBuilt: positionsCount > 0 || isConnected || hasSyncedAtLeastOnce,
      edgeScoreComputed: resolvedCount > 0 || isConnected || hasSyncedAtLeastOnce,
    },
  });
}
