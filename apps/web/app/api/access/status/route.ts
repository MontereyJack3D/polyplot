import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ eligible: false, method: null, expiresAt: null });
    }

    const nowIso = new Date().toISOString();
    const { data: grants } = await supabase
      .from('access_grants')
      .select('*')
      .eq('user_id', user.id)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (grants && grants.length > 0) {
      return NextResponse.json({
        eligible: true,
        method: grants[0].granted_by,
        expiresAt: grants[0].expires_at,
      });
    }

    return NextResponse.json({ eligible: false, method: null, expiresAt: null });
  } catch (error) {
    console.error('Access status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
