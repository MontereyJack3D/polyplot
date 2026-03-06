import { NextRequest, NextResponse } from 'next/server';

import { inngest } from '@/lib/inngest/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as {
    venueId?: 'polymarket' | 'kalshi';
    externalAccountRef?: string;
    accountLabel?: string;
  };

  if (!body.venueId || !body.externalAccountRef) {
    return NextResponse.json({ error: 'Missing venueId or externalAccountRef' }, { status: 400 });
  }

  const { error } = await supabase.from('venue_accounts').upsert(
    {
      user_id: user.id,
      venue_id: body.venueId,
      external_account_ref: body.externalAccountRef,
      account_label: body.accountLabel ?? null,
      connection_status: 'syncing',
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,venue_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await inngest.send({
    name: 'user/sync.requested',
    data: {
      userId: user.id,
      venueId: body.venueId,
      walletAddress: body.externalAccountRef,
    },
  });

  return NextResponse.json({ status: 'syncing' });
}
