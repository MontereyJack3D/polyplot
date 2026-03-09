import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/next-auth-options';
import { createAdminClient } from '@/lib/supabase/server';

export interface SessionUserRecord {
  user_id: string;
  handle: string;
  display_name: string | null;
}

export async function getSessionWalletAddress(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.address?.toLowerCase() ?? null;
}

export async function findUserByWalletAddress(address: string): Promise<SessionUserRecord | null> {
  const supabase = createAdminClient();

  const { data: byHandle } = await supabase
    .from('users')
    .select('user_id, handle, display_name')
    .eq('handle', address)
    .maybeSingle();

  if (byHandle) return byHandle;

  const { data: bySettings } = await supabase
    .from('users')
    .select('user_id, handle, display_name')
    .contains('settings_json', { walletAddress: address })
    .maybeSingle();

  return bySettings ?? null;
}

export async function ensureUserForWallet(address: string): Promise<{ user: SessionUserRecord; isNew: boolean }> {
  const existing = await findUserByWalletAddress(address);
  if (existing) return { user: existing, isNew: false };

  const supabase = createAdminClient();
  const displayName = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      handle: address,
      display_name: displayName,
      privacy_mode: 'public',
      settings_json: { walletAddress: address },
    })
    .select('user_id, handle, display_name')
    .single();

  if (error || !user) {
    throw new Error(error?.message || 'Failed to create user');
  }

  await supabase.from('user_rating_state').upsert({ user_id: user.user_id }, { onConflict: 'user_id' });
  await supabase.from('access_grants').insert({
    user_id: user.user_id,
    granted_by: 'token_gate',
    expires_at: null,
  });

  return { user, isNew: true };
}

export async function requireSessionUser(options?: { ensure?: boolean }): Promise<{
  walletAddress: string;
  user: SessionUserRecord;
}> {
  const walletAddress = await getSessionWalletAddress();
  if (!walletAddress) {
    throw new Error('UNAUTHORIZED');
  }

  if (options?.ensure === false) {
    const user = await findUserByWalletAddress(walletAddress);
    if (!user) throw new Error('USER_NOT_FOUND');
    return { walletAddress, user };
  }

  const { user } = await ensureUserForWallet(walletAddress);
  return { walletAddress, user };
}
