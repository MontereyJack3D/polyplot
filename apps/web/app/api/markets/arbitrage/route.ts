import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('arbitrage_opportunities')
    .select(
      'arb_id,prob_polymarket,prob_kalshi,spread,expected_profit_bps,execution_confidence,status,market_id_polymarket,market_id_kalshi,markets!arbitrage_opportunities_market_id_polymarket_fkey(question),markets_kalshi:markets!arbitrage_opportunities_market_id_kalshi_fkey(question)'
    )
    .eq('status', 'active')
    .order('expected_profit_bps', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data ?? []).map((row) => {
      const marketA = Array.isArray(row.markets) ? row.markets[0] : row.markets;
      const marketB = Array.isArray(row.markets_kalshi) ? row.markets_kalshi[0] : row.markets_kalshi;

      return {
        id: row.arb_id,
        marketPair: `${marketA?.question ?? 'Polymarket'} vs ${marketB?.question ?? 'Kalshi'}`,
        polymarketProb: row.prob_polymarket,
        kalshiProb: row.prob_kalshi,
        spread: row.spread,
        expectedProfitBps: row.expected_profit_bps,
        executionConfidence: row.execution_confidence,
        status: row.status,
      };
    }),
  });
}
