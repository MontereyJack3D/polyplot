import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: accounts, error } = await supabase
    .from('venue_accounts')
    .select('venue_account_id,venue_id,external_account_ref,account_label,connection_status,last_sync_at,connected_at,venues(name,brand_color)')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(accounts || []);
}
