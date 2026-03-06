'use client';

import { useQuery } from '@tanstack/react-query';
import type { AccessStatusResponse } from '@polyplot/core';

export function useAccess() {
  return useQuery<AccessStatusResponse>({
    queryKey: ['access-status'],
    queryFn: async () => {
      const res = await fetch('/api/access/status');
      if (!res.ok) throw new Error('Failed to check access');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
