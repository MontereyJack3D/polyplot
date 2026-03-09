import { NextResponse } from 'next/server';

import { checkNFTOwnership } from '@/lib/nft-gate';
import { ensureUserForWallet, getSessionWalletAddress } from '@/lib/auth/session-user';

export async function POST() {
  const walletAddress = await getSessionWalletAddress();
  if (!walletAddress) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const hasNFT = await checkNFTOwnership(walletAddress);
  if (!hasNFT) {
    return NextResponse.json({ error: 'NFT access required' }, { status: 403 });
  }

  try {
    const result = await ensureUserForWallet(walletAddress);
    return NextResponse.json({ user: result.user, isNew: result.isNew });
  } catch (error) {
    console.error('User ensure error:', error);
    return NextResponse.json({ error: 'Failed to ensure user' }, { status: 500 });
  }
}
