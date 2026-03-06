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

  const { data } = await supabase
    .from('user_category_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .eq('timeframe_key', timeframe)
    .eq('venue_scope', venue)
    .order('edge_contribution', { ascending: false });

  return NextResponse.json({
    rows: (data ?? []).map((row) => ({
      category: row.category,
      subcategory: row.subcategory,
      edge: row.edge_contribution ?? 0,
      winRate: row.win_rate ?? 0,
      roi: row.roi ?? 0,
      trades: row.trade_count ?? 0,
      pnl: row.pnl_total ?? 0,
      momentum: row.momentum_contribution ?? 0,
    })),
  });
}
