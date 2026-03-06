import { NextRequest, NextResponse } from 'next/server';

import type { DrilldownResponse } from '@polyplot/core';

import { createServerSupabaseClient } from '@/lib/supabase/server';

type MetricKey = 'winRate' | 'roi' | 'totalPnL' | 'momentum' | 'winStreak' | 'activeMarkets';

function getMetricValue(metric: MetricKey, row: Record<string, unknown>): number {
  switch (metric) {
    case 'winRate':
      return Number(row.win_rate ?? 0);
    case 'roi':
      return Number(row.roi ?? 0);
    case 'totalPnL':
      return Number(row.pnl_total ?? 0);
    case 'momentum':
      return Number(row.momentum_contribution ?? 0);
    case 'winStreak':
      return Number(row.win_rate ?? 0);
    case 'activeMarkets':
      return Number(row.trade_count ?? 0);
    default:
      return 0;
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const metric = (searchParams.get('metric') || 'winRate') as MetricKey;
  const timeframe = searchParams.get('timeframe') || 'ALL';
  const venue = searchParams.get('venue') || 'combined';

  const [{ data: snapshot }, { data: categories }] = await Promise.all([
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
      .select('*')
      .eq('user_id', user.id)
      .eq('timeframe_key', timeframe)
      .eq('venue_scope', venue)
      .order('trade_count', { ascending: false }),
  ]);

  const rows = (categories ?? []).map((row) => ({
    label: String(row.category ?? 'Unknown'),
    value: getMetricValue(metric, row as unknown as Record<string, unknown>),
    trades: Number(row.trade_count ?? 0),
    roi: Number(row.roi ?? 0),
    pnl: Number(row.pnl_total ?? 0),
    edgeContribution: Number(row.edge_contribution ?? 0),
  }));

  const overallValue =
    metric === 'winRate'
      ? Number(snapshot?.win_rate ?? 0)
      : metric === 'roi'
        ? Number(snapshot?.roi ?? 0)
        : metric === 'totalPnL'
          ? Number(snapshot?.pnl_total ?? 0)
          : metric === 'momentum'
            ? Number(snapshot?.momentum ?? 0)
            : metric === 'winStreak'
              ? Number(snapshot?.win_streak_current ?? 0)
              : Number(snapshot?.active_markets_count ?? 0);

  const response: DrilldownResponse = {
    metric,
    overall: {
      value: overallValue,
      trades: Number(snapshot?.trade_count ?? 0),
    },
    levels: [
      {
        level: 0,
        rows,
      },
    ],
  };

  return NextResponse.json(response);
}
