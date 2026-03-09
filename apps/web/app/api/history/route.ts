import { NextRequest, NextResponse } from 'next/server';

import { requireSessionUser } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const DEFAULT_LIMIT = 50;

function parseLimit(v: string | null): number {
  const n = Number(v ?? DEFAULT_LIMIT);
  return Number.isFinite(n) ? Math.min(Math.max(1, n), 100) : DEFAULT_LIMIT;
}

function parseCursor(v: string | null): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

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
  const venue = searchParams.get('venue');
  const category = searchParams.get('category');
  const timeframe = searchParams.get('timeframe') ?? 'ALL';
  const outcome = searchParams.get('outcome') ?? 'all';
  const search = (searchParams.get('search') ?? '').trim();
  const limit = parseLimit(searchParams.get('limit'));
  const cursor = parseCursor(searchParams.get('cursor'));

  let query = supabase
    .from('trades')
    .select(
      'trade_id,market_id,ts,side,direction,price_prob,quantity,fee_paid,status,markets!inner(question,category_raw,venue_id),decisions(actual_S,rating_delta_final,capture)',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('ts', { ascending: false })
    .range(cursor, cursor + limit - 1);

  if (timeframe !== 'ALL') {
    const now = Date.now();
    let start: Date | null = null;
    if (timeframe === '7D') start = new Date(now - 7 * 24 * 60 * 60 * 1000);
    if (timeframe === '30D') start = new Date(now - 30 * 24 * 60 * 60 * 1000);
    if (timeframe === '1Y') start = new Date(now - 365 * 24 * 60 * 60 * 1000);
    if (timeframe === 'YTD') start = new Date(new Date().getFullYear(), 0, 1);
    if (timeframe === 'custom') {
      const customStart = searchParams.get('customStart');
      const customEnd = searchParams.get('customEnd');
      if (customStart) start = new Date(customStart);
      if (customEnd) query = query.lte('ts', new Date(customEnd).toISOString());
    }
    if (start) query = query.gte('ts', start.toISOString());
  }

  if (venue && venue !== 'combined') query = query.eq('venue_id', venue);
  if (category && category !== 'All') query = query.eq('markets.category_raw', category);
  if (search) query = query.ilike('markets.question', `%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((row) => {
    const market = Array.isArray(row.markets) ? row.markets[0] : row.markets;
    const decision = Array.isArray(row.decisions) ? row.decisions[0] : row.decisions;

    const outcomeLabel =
      decision?.actual_S === null || decision?.actual_S === undefined
        ? 'pending'
        : decision.actual_S > 0.5
          ? 'win'
          : 'loss';

    const pnl = (decision?.capture ?? 0) * row.quantity;

    return {
      tradeId: row.trade_id,
      date: row.ts,
      marketId: row.market_id,
      market: market?.question ?? 'Unknown market',
      category: market?.category_raw ?? 'Other',
      venue: market?.venue_id ?? 'polymarket',
      side: row.side,
      direction: row.direction,
      price: row.price_prob,
      quantity: row.quantity,
      fee: row.fee_paid ?? 0,
      pnl,
      outcome: outcomeLabel,
      edgeDelta: decision?.rating_delta_final ?? null,
      capture: decision?.capture ?? null,
      result: outcomeLabel,
    };
  });

  const filtered = outcome === 'all' ? rows : rows.filter((row) => row.outcome === outcome);

  const pnlSeries = filtered.map((r) => r.pnl);
  const totalPnl = pnlSeries.reduce((sum, value) => sum + value, 0);
  const wins = filtered.filter((r) => r.outcome === 'win').length;
  const winRate = filtered.length ? wins / filtered.length : 0;
  const bestTrade = pnlSeries.length ? Math.max(...pnlSeries) : 0;
  const worstTrade = pnlSeries.length ? Math.min(...pnlSeries) : 0;
  const nextCursor = count && cursor + limit < count ? String(cursor + limit) : null;

  return NextResponse.json({
    items: filtered,
    nextCursor,
    summary: {
      totalTrades: filtered.length,
      winRate,
      totalPnl,
      bestTrade,
      worstTrade,
    },
  });
}
