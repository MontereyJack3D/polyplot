'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useNFTGate() {
  const { data: session, status } = useSession();

  const query = useQuery({
    queryKey: ['nft-gate', session?.user?.address],
    queryFn: async () => {
      const res = await fetch('/api/access/nft-check');
      if (!res.ok) throw new Error('Failed to check NFT access');
      return res.json() as Promise<{ eligible: boolean; reason?: string }>;
    },
    enabled: status === 'authenticated' && !!session?.user?.address,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isConnected: status === 'authenticated',
    isLoading: status === 'loading' || query.isLoading,
    hasAccess: query.data?.eligible === true,
    address: session?.user?.address || null,
    reason: query.data?.reason,
    refresh: query.refetch,
  };
}
