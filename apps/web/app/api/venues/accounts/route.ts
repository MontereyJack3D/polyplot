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

  const { data: accounts, error } = await supabase
    .from('venue_accounts')
    .select('venue_account_id,venue_id,external_account_ref,account_label,connection_status,last_sync_at,connected_at,venues(name,brand_color)')
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(accounts || []);
}
