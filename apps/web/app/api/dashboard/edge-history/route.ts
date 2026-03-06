import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function weekKey(date: Date): string {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  return `${start.getUTCFullYear()}-W${String(Math.ceil(start.getUTCDate() / 7)).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const timeframe = new URL(request.url).searchParams.get('timeframe') || 'ALL';
  const mode: 'week' | 'month' = timeframe === 'ALL' || timeframe === '1Y' || timeframe === 'YTD' ? 'month' : 'week';

  const { data } = await supabase
    .from('rating_events')
    .select('ts, r_after')
    .eq('user_id', user.id)
    .order('ts', { ascending: true })
    .limit(1000);

  const buckets = new Map<string, { ts: string; score: number }>();

  for (const row of data ?? []) {
    const date = new Date(row.ts);
    const key = mode === 'month' ? monthKey(date) : weekKey(date);
    buckets.set(key, { ts: row.ts, score: Number(row.r_after ?? 0) });
  }

  const result = Array.from(buckets.values()).map((entry) => ({
    date: entry.ts,
    score: entry.score,
  }));

  return NextResponse.json(result);
}
