import { NextRequest, NextResponse } from 'next/server';

import { findUserByWalletAddress, getSessionWalletAddress } from '@/lib/auth/session-user';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createServerSupabaseClient();
  const walletAddress = await getSessionWalletAddress();
  const requester = walletAddress ? await findUserByWalletAddress(walletAddress) : null;
  if (handle === 'me' && !requester?.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = handle === 'me'
    ? await supabase.from('users').select('*').eq('user_id', requester?.user_id).single()
    : await supabase.from('users').select('*').eq('handle', handle).single();

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isOwner = requester?.user_id === profile.user_id;
  if (!isOwner && profile.privacy_mode === 'private') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data } = await supabase
    .from('user_achievements')
    .select(
      'status, progress_current, progress_target, unlocked_at, achievements(name, family, tier, icon_ref, is_hidden, description, criteria_json)'
    )
    .eq('user_id', profile.user_id);

  const unlocked = (data ?? [])
    .filter((row) => row.status === 'unlocked' && row.achievements)
    .map((row) => {
      const achievement = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
      return {
        name: achievement?.name ?? 'Achievement',
        family: achievement?.family ?? 'general',
        tier: achievement?.tier ?? 'bronze',
        unlockedAt: row.unlocked_at || new Date().toISOString(),
        iconRef: achievement?.icon_ref ?? null,
        description: achievement?.description ?? null,
        criteria: achievement?.criteria_json ?? null,
      };
    });

  const inProgress = (data ?? [])
    .filter((row) => row.status !== 'unlocked' && row.achievements)
    .map((row) => {
      const achievement = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
      return {
        name: achievement?.name ?? 'Achievement',
        family: achievement?.family ?? 'general',
        tier: achievement?.tier ?? 'bronze',
        progress: row.progress_current ?? 0,
        target: row.progress_target ?? 1,
        iconRef: achievement?.icon_ref ?? null,
        description: achievement?.description ?? null,
        criteria: achievement?.criteria_json ?? null,
        isHidden: achievement?.is_hidden ?? false,
      };
    });

  const hiddenLockedCount = (data ?? []).filter((row) => {
    const achievement = Array.isArray(row.achievements) ? row.achievements[0] : row.achievements;
    return row.status !== 'unlocked' && achievement?.is_hidden;
  }).length;

  return NextResponse.json({ unlocked, inProgress, hiddenLockedCount });
}
