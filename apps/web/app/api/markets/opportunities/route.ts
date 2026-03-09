import { NextResponse } from 'next/server';

import { requireSessionUser } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface OpportunityRow {
  market_id: string;
  opportunity_score: number;
  components_json: Record<string, unknown> | null;
  explanation_text: string | null;
  recommended_action: string | null;
  markets:
    | {
        market_id: string;
        question: string;
        category_raw: string | null;
        end_time: string | null;
        venue_id: string;
        status: string;
      }
    | Array<{
        market_id: string;
        question: string;
        category_raw: string | null;
        end_time: string | null;
        venue_id: string;
        status: string;
      }>;
}

interface MarketPriceRow {
  market_id: string;
  ts: string;
  mid_prob: number | null;
  volume_24h: number | null;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  let sessionUser: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    sessionUser = await requireSessionUser();
  } catch {
    return NextResponse.json({ items: [] });
  }
  const userId = sessionUser.user.user_id;

  const { data, error } = await supabase
    .from('opportunity_rankings')
    .select('market_id,opportunity_score,components_json,explanation_text,recommended_action,markets!inner(market_id,question,category_raw,end_time,venue_id,status)')
    .eq('user_id', userId)
    .order('opportunity_score', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as OpportunityRow[];
  if (rows.length === 0) return NextResponse.json({ items: [] });

  const marketIds = rows.map((row) => row.market_id);
  const { data: priceRows } = await supabase
    .from('market_prices')
    .select('market_id,ts,mid_prob,volume_24h')
    .in('market_id', marketIds)
    .order('ts', { ascending: false });

  const latestPriceByMarket = new Map<string, MarketPriceRow>();
  for (const row of (priceRows ?? []) as MarketPriceRow[]) {
    if (!latestPriceByMarket.has(row.market_id)) latestPriceByMarket.set(row.market_id, row);
  }

  return NextResponse.json({
    items: rows.map((row) => {
      const market = Array.isArray(row.markets) ? row.markets[0] : row.markets;
      const latest = latestPriceByMarket.get(row.market_id);

      return {
        marketId: row.market_id,
        question: market?.question ?? 'Unknown market',
        category: market?.category_raw ?? 'Other',
        venue: market?.venue_id ?? 'polymarket',
        currentProb: latest?.mid_prob ?? 0.5,
        volume24h: latest?.volume_24h ?? 0,
        endTime: market?.end_time ?? null,
        opportunityScore: row.opportunity_score ?? 0,
        components: row.components_json ?? {
          skillAlignment: 0,
          mispricingSignal: 0,
          momentumBonus: 0,
          riskPenalty: 0,
        },
        explanation: row.explanation_text ?? 'General market opportunity',
        recommendedAction: row.recommended_action ?? 'watch',
      };
    }),
  });
}
