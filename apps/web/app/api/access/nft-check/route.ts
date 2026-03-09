import { NextResponse } from 'next/server';

import { findUserByWalletAddress } from '@/lib/auth/session-user';
import { checkNFTOwnership } from '@/lib/nft-gate';
import { createAdminClient } from '@/lib/supabase/server';
import { getSessionWalletAddress } from '@/lib/auth/session-user';

export async function GET() {
  const walletAddress = await getSessionWalletAddress();

  if (!walletAddress) {
    return NextResponse.json({ eligible: false, reason: 'not_connected' });
  }

  const hasNFT = await checkNFTOwnership(walletAddress);
  if (hasNFT) {
    return NextResponse.json({
      eligible: true,
      address: walletAddress,
      reason: 'nft_holder',
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
    });
  }

  const appUser = await findUserByWalletAddress(walletAddress);
  if (!appUser) {
    return NextResponse.json({
      eligible: false,
      address: walletAddress,
      reason: 'no_nft',
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
    });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: grants } = await admin
    .from('access_grants')
    .select('grant_id')
    .eq('user_id', appUser.user_id)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .limit(1);

  const hasGrant = (grants?.length ?? 0) > 0;

  return NextResponse.json({
    eligible: hasGrant,
    address: walletAddress,
    reason: hasGrant ? 'access_grant' : 'no_nft',
    contractAddress: process.env.NFT_CONTRACT_ADDRESS,
  });
}
