import { NextRequest, NextResponse } from 'next/server';

import type { MarketIntelligenceResponse, ProbabilityBand, VenueId } from '@polyplot/core';

import { createServerSupabaseClient } from '@/lib/supabase/server';

function probabilityBand(prob: number): ProbabilityBand {
  if (prob < 0.2) return '0-20';
  if (prob < 0.4) return '20-40';
  if (prob < 0.6) return '40-60';
  if (prob < 0.8) return '60-80';
  return '80-100';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: market } = await supabase
    .from('markets')
    .select('market_id,venue_id,question,category_raw,subcategory_raw,end_time,venue_market_id')
    .eq('market_id', marketId)
    .single();

  if (!market) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: prices }, { data: signals }, { data: position }, { data: related }, { data: snapshots }, { data: mapping }] =
    await Promise.all([
      supabase
        .from('market_prices')
        .select('ts,mid_prob,volume_24h,liquidity_score')
        .eq('market_id', marketId)
        .order('ts', { ascending: false })
        .limit(120),
      supabase
        .from('engine_signals')
        .select('signal_type,severity,value_json')
        .eq('subject_type', 'market')
        .eq('subject_id', marketId)
        .order('ts', { ascending: false })
        .limit(6),
      supabase
        .from('positions')
        .select('venue_id,position_side,avg_entry_prob,last_mark_prob,unrealized_pnl,status')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .in('status', ['open', 'resolved'])
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('markets')
        .select('market_id,question')
        .eq('category_raw', market.category_raw)
        .neq('market_id', marketId)
        .limit(5),
      supabase
        .from('user_category_snapshots')
        .select('edge_contribution,win_rate,trade_count,roi')
        .eq('user_id', user.id)
        .eq('category', market.category_raw ?? '')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('market_mapping')
        .select('market_id_a,market_id_b,markets_a:markets!market_mapping_market_id_a_fkey(market_id,venue_id),markets_b:markets!market_mapping_market_id_b_fkey(market_id,venue_id)')
        .or(`market_id_a.eq.${marketId},market_id_b.eq.${marketId}`)
        .limit(1)
        .maybeSingle(),
    ]);

  const current = (prices ?? [])[0];
  const series = [...(prices ?? [])].reverse().map((p) => ({
    ts: p.ts,
    prob: p.mid_prob ?? 0,
    volume24h: p.volume_24h,
    liquidityScore: p.liquidity_score,
  }));

  const band = probabilityBand(current?.mid_prob ?? 0.5);

  let venueComparison: MarketIntelligenceResponse['venueComparison'] = null;
  if (mapping) {
    const marketA = Array.isArray(mapping.markets_a) ? mapping.markets_a[0] : mapping.markets_a;
    const marketB = Array.isArray(mapping.markets_b) ? mapping.markets_b[0] : mapping.markets_b;

    const otherMarketId = marketA?.market_id === marketId ? marketB?.market_id : marketA?.market_id;
    const otherVenue = marketA?.market_id === marketId ? marketB?.venue_id : marketA?.venue_id;

    if (otherMarketId && otherVenue) {
      const { data: otherPrice } = await supabase
        .from('market_prices')
        .select('mid_prob')
        .eq('market_id', otherMarketId)
        .order('ts', { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentProb = current?.mid_prob ?? null;
      const comparisonProb = otherPrice?.mid_prob ?? null;
      if (currentProb !== null && comparisonProb !== null) {
        venueComparison = {
          venues: [
            {
              venue: market.venue_id as VenueId,
              yes: currentProb,
              no: 1 - currentProb,
              feesBps: 0,
            },
            {
              venue: otherVenue as VenueId,
              yes: comparisonProb,
              no: 1 - comparisonProb,
              feesBps: 0,
            },
          ],
          spread: Math.abs(currentProb - comparisonProb),
          arbDetected: Math.abs(currentProb - comparisonProb) > 0.03,
        };
      }
    }
  }

  const response: MarketIntelligenceResponse = {
    market: {
      marketId: market.market_id,
      question: market.question,
      category: market.category_raw ?? 'Other',
      subcategory: market.subcategory_raw,
      endTime: market.end_time,
    },
    prices: {
      current: {
        venue: market.venue_id as VenueId,
        prob: current?.mid_prob ?? 0,
      },
      series,
    },
    venueComparison,
    edgeAlignment: {
      categoryEdgeScore: snapshots?.edge_contribution ?? 0,
      band,
      bandWinRate: snapshots?.win_rate ?? 0,
      bandRoi: snapshots?.roi ?? 0,
      similarTrades: snapshots?.trade_count ?? 0,
      alignment:
        (snapshots?.edge_contribution ?? 0) > 5
          ? 'strong'
          : (snapshots?.edge_contribution ?? 0) > 0
            ? 'moderate'
            : (snapshots?.trade_count ?? 0) > 0
              ? 'weak'
              : 'no_data',
    },
    signals: (signals ?? []).map((signal) => ({
      type: signal.signal_type,
      severity: signal.severity ?? 0,
      label: signal.signal_type.replace(/_/g, ' '),
      explain: typeof signal.value_json === 'object' && signal.value_json && 'explain' in signal.value_json
        ? String((signal.value_json as { explain?: unknown }).explain)
        : 'No additional context available.',
    })),
    position: position
      ? {
          hasPosition: true,
          venue: position.venue_id as VenueId,
          side: position.position_side,
          entryProb: position.avg_entry_prob ?? undefined,
          currentProb: position.last_mark_prob ?? undefined,
          pnl: position.unrealized_pnl ?? undefined,
        }
      : { hasPosition: false },
    relatedMarkets: (related ?? []).map((entry) => ({
      marketId: entry.market_id,
      question: entry.question,
      prob: 0,
    })),
  };

  return NextResponse.json(response);
}
