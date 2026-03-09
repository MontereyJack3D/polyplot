import { NextRequest, NextResponse } from 'next/server';

import type { ActivityItem, ActivityResponse } from '@polyplot/core';

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

  const limit = Number(new URL(request.url).searchParams.get('limit') || '20');

  const [{ data: decisions }, { data: trades }, { data: achievements }] = await Promise.all([
    supabase
      .from('decisions')
      .select('decision_id, market_id, resolved_ts, entry_ts, actual_S, rating_delta_final')
      .eq('user_id', userId)
      .order('resolved_ts', { ascending: false })
      .limit(limit),
    supabase
      .from('trades')
      .select('trade_id, market_id, ts, quantity, price_prob, direction')
      .eq('user_id', userId)
      .order('ts', { ascending: false })
      .limit(limit),
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at, achievements(name)')
      .eq('user_id', userId)
      .eq('status', 'unlocked')
      .order('unlocked_at', { ascending: false })
      .limit(limit),
  ]);

  const decisionItems: ActivityItem[] = (decisions ?? []).map((d) => ({
    id: `decision-${d.decision_id}`,
    ts: d.resolved_ts || d.entry_ts,
    type: 'resolution',
    marketId: d.market_id,
    title: d.actual_S !== null && d.actual_S > 0.5 ? 'Resolved winning decision' : 'Resolved losing decision',
    result: d.actual_S === null ? 'pending' : d.actual_S > 0.5 ? 'win' : 'loss',
    pnl: null,
    edgeDelta: d.rating_delta_final,
  }));

  const tradeItems: ActivityItem[] = (trades ?? []).map((t) => ({
    id: `trade-${t.trade_id}`,
    ts: t.ts,
    type: 'trade',
    marketId: t.market_id,
    title: `${t.direction === 'buy' ? 'Bought' : 'Sold'} ${t.quantity} @ ${(t.price_prob * 100).toFixed(1)}%`,
    result: null,
    pnl: null,
    edgeDelta: null,
  }));

  const achievementItems: ActivityItem[] = (achievements ?? []).map((a) => {
    const achievementName =
      typeof a.achievements === 'object' && a.achievements && 'name' in a.achievements
        ? String((a.achievements as { name?: unknown }).name ?? 'Achievement unlocked')
        : 'Achievement unlocked';

    return {
      id: `achievement-${a.achievement_id}`,
      ts: a.unlocked_at || new Date().toISOString(),
      type: 'achievement',
      marketId: null,
      title: achievementName,
      result: null,
      pnl: null,
      edgeDelta: null,
    } as ActivityItem;
  });

  const items = [...decisionItems, ...tradeItems, ...achievementItems]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, Math.max(1, Math.min(limit, 100)));

  const response: ActivityResponse = {
    items,
    nextCursor: null,
  };

  return NextResponse.json(response);
}
