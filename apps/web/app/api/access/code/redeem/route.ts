import { createHash } from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ access: 'invalid' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const codeHash = createHash('sha256').update(code.trim().toUpperCase()).digest('hex');

    const admin = createAdminClient();

    const { data: codeRecord, error: codeError } = await admin
      .from('access_codes')
      .select('*')
      .eq('code_hash', codeHash)
      .single();

    if (codeError || !codeRecord) {
      return NextResponse.json({ access: 'invalid' }, { status: 400 });
    }

    if (codeRecord.is_single_use && codeRecord.used_at) {
      return NextResponse.json({ access: 'already_used' }, { status: 400 });
    }

    const expiresAt = codeRecord.access_duration_days
      ? new Date(Date.now() + codeRecord.access_duration_days * 86_400_000).toISOString()
      : null;

    const { error: grantError } = await admin.from('access_grants').insert({
      user_id: user.id,
      granted_by: 'code',
      expires_at: expiresAt,
    });

    if (grantError) {
      console.error('Failed to create access grant:', grantError);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    await admin
      .from('access_codes')
      .update({ used_at: new Date().toISOString(), used_by_user_id: user.id })
      .eq('code_id', codeRecord.code_id);

    return NextResponse.json({ access: 'granted', expiresAt });
  } catch (error) {
    console.error('Code redemption error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
