import { NextRequest, NextResponse } from 'next/server';

import { requireSessionUser } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  const supabase = await createServerSupabaseClient();
  let sessionUser: Awaited<ReturnType<typeof requireSessionUser>>;
  try {
    sessionUser = await requireSessionUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = sessionUser.user.user_id;

  const { error } = await supabase
    .from('venue_accounts')
    .update({ connection_status: 'disconnected' })
    .eq('user_id', userId)
    .eq('venue_id', venueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: 'disconnected' });
}
