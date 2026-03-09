import { createHash } from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { ensureUserForWallet, getSessionWalletAddress } from '@/lib/auth/session-user';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const walletAddress = await getSessionWalletAddress();
    if (!walletAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = (await request.json()) as { code?: string };
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ access: 'invalid' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const codeHash = createHash('sha256').update(normalizedCode).digest('hex');
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

    const { user } = await ensureUserForWallet(walletAddress);
    const expiresAt = codeRecord.access_duration_days
      ? new Date(Date.now() + codeRecord.access_duration_days * 86_400_000).toISOString()
      : null;

    const { error: grantError } = await admin.from('access_grants').insert({
      user_id: user.user_id,
      granted_by: 'code',
      expires_at: expiresAt,
    });

    if (grantError) {
      return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
    }

    await admin
      .from('access_codes')
      .update({ used_at: new Date().toISOString(), used_by_user_id: user.user_id })
      .eq('code_id', codeRecord.code_id);

    return NextResponse.json({ access: 'granted', expiresAt });
  } catch (error) {
    console.error('Code redemption error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
