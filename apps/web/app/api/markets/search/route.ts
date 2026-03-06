import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

const PAGE_SIZE = 30;

function parseCursor(value: string | null): number {
  const parsed = Number(value ?? '0');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const category = searchParams.get('category');
  const venue = searchParams.get('venue');
  const status = searchParams.get('status') ?? 'open';
  const sort = searchParams.get('sort') ?? 'volume';
  const watchlistOnly = searchParams.get('watchlist') === '1';
  const cursor = parseCursor(searchParams.get('cursor'));

  const { data: userRow } = await supabase
    .from('users')
    .select('settings_json')
    .eq('user_id', user.id)
    .single();

  const watchlistIds = ((userRow?.settings_json as { watchlist?: string[] } | null)?.watchlist ?? []).filter(Boolean);

  let marketsQuery = supabase
    .from('markets')
    .select(
      'market_id,venue_id,venue_market_id,question,category_raw,subcategory_raw,status,end_time,url,created_at,tags',
      { count: 'exact' }
    )
    .range(cursor, cursor + PAGE_SIZE - 1);

  if (q) marketsQuery = marketsQuery.ilike('question', `%${q}%`);
  if (category && category !== 'All') marketsQuery = marketsQuery.ilike('category_raw', category);
  if (venue && venue !== 'combined') marketsQuery = marketsQuery.eq('venue_id', venue);

  if (status === 'resolved' || status === 'closed') {
    marketsQuery = marketsQuery.in('status', status === 'resolved' ? ['resolved'] : ['closed']);
  } else {
    marketsQuery = marketsQuery.eq('status', 'open');
  }

  if (watchlistOnly) {
    if (watchlistIds.length === 0) {
      return NextResponse.json({ items: [], nextCursor: null, watchlistIds: [] });
    }
    marketsQuery = marketsQuery.in('market_id', watchlistIds);
  }

  if (sort === 'newest') {
    marketsQuery = marketsQuery.order('created_at', { ascending: false });
  } else {
    marketsQuery = marketsQuery.order('updated_at', { ascending: false });
  }

  const { data: markets, count, error } = await marketsQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const marketIds = (markets ?? []).map((m) => m.market_id);
  const { data: prices } = marketIds.length
    ? await supabase
        .from('market_prices')
        .select('market_id,mid_prob,volume_24h,ts')
        .in('market_id', marketIds)
        .order('ts', { ascending: false })
    : { data: [] as Array<{ market_id: string; mid_prob: number | null; volume_24h: number | null; ts: string }> };

  const latestPriceByMarket = new Map<string, { midProb: number | null; volume24h: number | null }>();
  for (const row of prices ?? []) {
    if (!latestPriceByMarket.has(row.market_id)) {
      latestPriceByMarket.set(row.market_id, {
        midProb: row.mid_prob,
        volume24h: row.volume_24h,
      });
    }
  }

  const items = (markets ?? []).map((market) => {
    const price = latestPriceByMarket.get(market.market_id);
    const endTime = market.end_time;
    const statusLabel =
      market.status === 'open' && endTime && new Date(endTime).getTime() - Date.now() < 24 * 60 * 60 * 1000
        ? 'closing-soon'
        : market.status;

    return {
      marketId: market.market_id,
      venueMarketId: market.venue_market_id,
      question: market.question,
      prob: price?.midProb ?? 0,
      venue: market.venue_id,
      category: market.category_raw ?? 'Other',
      subcategory: market.subcategory_raw,
      volume24h: price?.volume24h ?? null,
      endTime,
      status: statusLabel,
      url: market.url,
      hasPosition: false,
    };
  });

  const statusFiltered =
    status === 'closing-soon'
      ? items.filter((item) => item.status === 'closing-soon')
      : status === 'open'
        ? items.filter((item) => item.status === 'open' || item.status === 'closing-soon')
        : items;

  const sorted = [...statusFiltered].sort((a, b) => {
    if (sort === 'probability') return (b.prob ?? 0) - (a.prob ?? 0);
    if (sort === 'volume') return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    return 0;
  });

  const nextCursor = count && cursor + PAGE_SIZE < count ? String(cursor + PAGE_SIZE) : null;

  return NextResponse.json({
    items: sorted,
    nextCursor,
    watchlistIds,
  });
}
