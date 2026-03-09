import { NextResponse } from 'next/server';

import { requireSessionUser } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  let sessionUser: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    sessionUser = await requireSessionUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = sessionUser.user.user_id;

  const { data: balances, error } = await supabase
    .from('venue_balances')
    .select('venue_id,total_balance,used_balance,available_balance,pnl_24h,ts')
    .eq('user_id', userId)
    .order('ts', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const latestByVenue = new Map<string, (typeof balances)[number]>();
  for (const row of balances ?? []) {
    if (!latestByVenue.has(row.venue_id)) latestByVenue.set(row.venue_id, row);
  }

  const venues = Array.from(latestByVenue.values()).map((row) => ({
    venue: row.venue_id,
    total: row.total_balance,
    used: row.used_balance,
    available: row.available_balance,
    pnl24h: row.pnl_24h ?? 0,
  }));

  const totalBalance = venues.reduce((sum, venue) => sum + (venue.total ?? 0), 0);
  const pnl24h = venues.reduce((sum, venue) => sum + (venue.pnl24h ?? 0), 0);

  return NextResponse.json({
    totalBalance,
    pnl24h,
    venues,
  });
}
