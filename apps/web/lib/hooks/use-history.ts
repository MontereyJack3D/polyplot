'use client';

import { useQuery } from '@tanstack/react-query';

import { useFilterStore } from '@/lib/stores/filter-store';

interface HistoryParams {
  outcome?: 'all' | 'win' | 'loss' | 'pending';
  search?: string;
  cursor?: string | null;
  limit?: number;
}

export function useHistory(params: HistoryParams) {
  const { timeframe, venue, category, customRange } = useFilterStore();

  const query = new URLSearchParams();
  query.set('timeframe', timeframe);
  query.set('venue', venue);
  if (category) query.set('category', category);
  if (timeframe === 'custom' && customRange) {
    query.set('customStart', customRange.start);
    query.set('customEnd', customRange.end);
  }
  if (params.outcome) query.set('outcome', params.outcome);
  if (params.search) query.set('search', params.search);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));

  return useQuery({
    queryKey: ['history', timeframe, venue, category, params],
    queryFn: async () => {
      const res = await fetch(`/api/history?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
  });
}
