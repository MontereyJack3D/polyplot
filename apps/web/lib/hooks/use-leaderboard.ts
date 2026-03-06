'use client';

import { useQuery } from '@tanstack/react-query';

export function useLeaderboard(category: string, cursor?: string | null) {
  const query = new URLSearchParams();
  if (category && category !== 'All') query.set('category', category);
  if (cursor) query.set('cursor', cursor);
  query.set('limit', '50');

  return useQuery({
    queryKey: ['leaderboard', category, cursor],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
  });
}
