'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useWalletSummary() {
  const { status } = useSession();

  return useQuery({
    queryKey: ['wallet-summary'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/summary');
      if (!res.ok) throw new Error('Failed to fetch wallet summary');
      return res.json() as Promise<{
        totalBalance: number;
        pnl24h: number;
        venues: Array<{
          venue: 'polymarket' | 'kalshi';
          total: number;
          used: number;
          available: number;
          pnl24h: number;
        }>;
      }>;
    },
    staleTime: 60_000,
    enabled: status === 'authenticated',
  });
}
