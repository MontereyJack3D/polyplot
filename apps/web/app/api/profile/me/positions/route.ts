import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = new URL(request.url).searchParams.get('status') || 'open';

  const { data } = await supabase
    .from('positions')
    .select('*, markets(question, venue_market_id)')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('opened_at', { ascending: false });

  return NextResponse.json({
    items: (data ?? []).map((row) => ({
      positionId: row.position_id,
      marketId: row.market_id,
      marketQuestion:
        Array.isArray(row.markets) && row.markets[0]?.question
          ? row.markets[0].question
          : typeof row.markets === 'object' && row.markets && 'question' in row.markets
            ? (row.markets as { question?: string }).question
            : 'Unknown market',
      side: row.position_side,
      status: row.status,
      entryProb: row.avg_entry_prob,
      exitProb: row.avg_exit_prob,
      currentProb: row.last_mark_prob,
      netQuantity: row.net_quantity,
      costBasis: row.cost_basis,
      currentValue: row.current_value,
      realizedPnl: row.realized_pnl,
      unrealizedPnl: row.unrealized_pnl,
      roiTotal: row.roi_total,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
    })),
  });
}
