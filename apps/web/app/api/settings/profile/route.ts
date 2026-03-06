import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [{ data: userRow }, { data: venueAccounts }] = await Promise.all([
    supabase.from('users').select('*').eq('user_id', user.id).single(),
    supabase
      .from('venue_accounts')
      .select('venue_id,external_account_ref,connection_status,last_sync_at,account_label')
      .eq('user_id', user.id),
  ]);

  return NextResponse.json({
    profile: {
      display_name: userRow?.display_name ?? '',
      handle: userRow?.handle ?? '',
      privacy_mode: userRow?.privacy_mode ?? 'private',
      default_timeframe: userRow?.default_timeframe ?? '30D',
      default_venue_view: userRow?.default_venue_view ?? 'combined',
      settings_json: userRow?.settings_json ?? {},
    },
    venues: venueAccounts ?? [],
    email: user.email ?? '',
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const updates = (await request.json()) as Record<string, unknown>;

  const allowedFields = ['display_name', 'privacy_mode', 'default_timeframe', 'default_venue_view', 'settings_json'];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([key]) => allowedFields.includes(key)));

  const { error } = await supabase.from('users').update(filtered).eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
