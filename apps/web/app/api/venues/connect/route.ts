import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { requireSessionUser } from '@/lib/auth/session-user';
import { inngest } from '@/lib/inngest/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VENUE_BOOTSTRAP: Record<'polymarket' | 'kalshi', { name: string; brandColor: string; supportsOrderbook: boolean }> = {
  polymarket: { name: 'Polymarket', brandColor: '#00d4aa', supportsOrderbook: true },
  kalshi: { name: 'Kalshi', brandColor: '#00b389', supportsOrderbook: false },
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

  const body = (await request.json()) as {
    venueId?: 'polymarket' | 'kalshi';
    externalAccountRef?: string;
    accountLabel?: string;
    connectionMethod?: 'eoa' | 'social';
  };

  if (!body.venueId) {
    return NextResponse.json({ error: 'Missing venueId' }, { status: 400 });
  }
  if (!VENUE_BOOTSTRAP[body.venueId]) {
    return NextResponse.json({ error: 'Unsupported venueId' }, { status: 400 });
  }

  const fallbackWallet = sessionUser.walletAddress.toLowerCase();
  const accountRef = (body.externalAccountRef || fallbackWallet).toLowerCase();

  if (!isAddress(accountRef)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const venueMeta = VENUE_BOOTSTRAP[body.venueId];
  const { error: venueError } = await supabase.from('venues').upsert(
    {
      venue_id: body.venueId,
      name: venueMeta.name,
      brand_color: venueMeta.brandColor,
      supports_trading: true,
      supports_orderbook: venueMeta.supportsOrderbook,
      fee_model_json: { maker_bps: 0, taker_bps: 0 },
    },
    { onConflict: 'venue_id' }
  );
  if (venueError) {
    return NextResponse.json({ error: venueError.message }, { status: 500 });
  }

  const { error } = await supabase.from('venue_accounts').upsert(
    {
      user_id: userId,
      venue_id: body.venueId,
      external_account_ref: accountRef,
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
      userId,
      venueId: body.venueId,
      walletAddress: accountRef,
    },
  });

  return NextResponse.json({
    status: 'syncing',
    externalAccountRef: accountRef,
    connectionMethod: body.connectionMethod ?? 'eoa',
  });
}
