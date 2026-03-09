import { NextRequest, NextResponse } from 'next/server';

import { requireSessionUser } from '@/lib/auth/session-user';
import { inngest } from '@/lib/inngest/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type VenueAccountRow = {
  external_account_ref: string;
};

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  let sessionUser: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    sessionUser = await requireSessionUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = sessionUser.user.user_id;

  const body = (await request.json()) as { venueId?: string };
  const venueId = body.venueId;

  if (!venueId) {
    return NextResponse.json({ error: 'venueId is required' }, { status: 400 });
  }

  const { data: account } = await supabase
    .from('venue_accounts')
    .select('external_account_ref')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .maybeSingle<VenueAccountRow>();

  if (!account) {
    return NextResponse.json({ error: 'Venue not connected' }, { status: 400 });
  }

  await supabase
    .from('venue_accounts')
    .update({ connection_status: 'syncing' })
    .eq('user_id', userId)
    .eq('venue_id', venueId);

  await inngest.send({
    name: 'user/sync.requested',
    data: {
      userId,
      venueId,
      walletAddress: account.external_account_ref,
    },
  });

  return NextResponse.json({ status: 'sync_started' });
}
