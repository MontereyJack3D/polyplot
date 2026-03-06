'use client';

import { useQuery } from '@tanstack/react-query';

import { useFilterStore } from '@/lib/stores/filter-store';

export type MarketTab = 'browse' | 'opportunities' | 'arbitrage' | 'watchlist';

interface SearchParams {
  q?: string;
  status?: string;
  sort?: string;
  cursor?: string | null;
}

export function useMarketsSearch(params: SearchParams) {
  const { venue, category } = useFilterStore();

  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.status) query.set('status', params.status);
  if (params.sort) query.set('sort', params.sort);
  if (params.cursor) query.set('cursor', params.cursor);
  if (venue) query.set('venue', venue);
  if (category) query.set('category', category);

  return useQuery({
    queryKey: ['markets-search', venue, category, params],
    queryFn: async () => {
      const res = await fetch(`/api/markets/search?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch markets');
      return res.json();
    },
  });
}

export function useMarketIntelligence(marketId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['market-intelligence', marketId],
    enabled: enabled && !!marketId,
    queryFn: async () => {
      const res = await fetch(`/api/markets/${marketId}/intelligence`);
      if (!res.ok) throw new Error('Failed to fetch market intelligence');
      return res.json();
    },
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: ['market-opportunities'],
    queryFn: async () => {
      const res = await fetch('/api/markets/opportunities');
      if (!res.ok) throw new Error('Failed to fetch opportunities');
      return res.json();
    },
  });
}

export function useArbitrage() {
  return useQuery({
    queryKey: ['market-arbitrage'],
    queryFn: async () => {
      const res = await fetch('/api/markets/arbitrage');
      if (!res.ok) throw new Error('Failed to fetch arbitrage opportunities');
      return res.json();
    },
  });
}

export function useSettingsProfile() {
  return useQuery({
    queryKey: ['settings-profile'],
    queryFn: async () => {
      const res = await fetch('/api/settings/profile');
      if (!res.ok) throw new Error('Failed to fetch settings profile');
      return res.json();
    },
  });
}
