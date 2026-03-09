'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

type VenueAccount = {
  venue_id: string;
  connection_status: 'connected' | 'disconnected' | 'syncing' | 'error';
};

export function useVenueAccounts() {
  const { status } = useSession();

  const query = useQuery({
    queryKey: ['venue-accounts'],
    enabled: status === 'authenticated',
    queryFn: async () => {
      const response = await fetch('/api/venues/accounts');
      if (!response.ok) throw new Error('Failed to fetch venue accounts');
      return (await response.json()) as VenueAccount[];
    },
    staleTime: 30_000,
  });

  const accounts = query.data ?? [];
  const hasConnectedVenue = accounts.some((account) => account.connection_status !== 'disconnected');

  return {
    ...query,
    accounts,
    hasConnectedVenue,
  };
}
