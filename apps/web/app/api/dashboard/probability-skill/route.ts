import { NextRequest, NextResponse } from 'next/server';

import type { ProbabilitySkillResponse } from '@polyplot/core';

import { requireSessionUser } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  let sessionUser: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    sessionUser = await requireSessionUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = sessionUser.user.user_id;

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'ALL';
  const venue = searchParams.get('venue') || 'combined';

  const { data } = await supabase
    .from('user_probability_band_snapshots')
    .select('probability_band, trade_count, win_rate, roi, edge_contribution, log_loss_avg, calibration_error')
    .eq('user_id', userId)
    .eq('timeframe_key', timeframe)
    .eq('venue_scope', venue)
    .order('probability_band', { ascending: true });

  const response: ProbabilitySkillResponse = {
    bands: (data ?? []).map((row) => ({
      band: row.probability_band,
      trades: row.trade_count ?? 0,
      winRate: row.win_rate ?? 0,
      roi: row.roi ?? 0,
      edgeContribution: row.edge_contribution ?? 0,
      logLossAvg: row.log_loss_avg ?? 0,
      calibrationError: row.calibration_error ?? 0,
    })),
  };

  return NextResponse.json(response);
}
