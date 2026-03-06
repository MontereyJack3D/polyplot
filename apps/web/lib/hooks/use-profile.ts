'use client';

import { useQuery } from '@tanstack/react-query';

import { useFilterStore } from '@/lib/stores/filter-store';

export function useProfileSummary(handle?: string) {
  const { timeframe, venue } = useFilterStore();

  return useQuery({
    queryKey: ['profile-summary', handle || 'me', timeframe, venue],
    queryFn: () =>
      fetch(
        handle
          ? `/api/profile/${handle}/summary?timeframe=${timeframe}&venue=${venue}`
          : `/api/profile/me/summary?timeframe=${timeframe}&venue=${venue}`
      ).then((response) => response.json()),
  });
}

export function useEdgeMap(handle?: string) {
  const { timeframe, venue } = useFilterStore();

  return useQuery({
    queryKey: ['edge-map', handle || 'me', timeframe, venue],
    queryFn: () =>
      fetch(`/api/profile/${handle || 'me'}/edge-map?timeframe=${timeframe}&venue=${venue}`).then((response) =>
        response.json()
      ),
  });
}

export function useCategorySnapshots() {
  const { timeframe, venue } = useFilterStore();

  return useQuery({
    queryKey: ['profile-category-snapshots', timeframe, venue],
    queryFn: () =>
      fetch(`/api/profile/me/categories?timeframe=${timeframe}&venue=${venue}`).then((response) => response.json()),
  });
}

export function useAchievements(handle?: string) {
  return useQuery({
    queryKey: ['achievements', handle || 'me'],
    queryFn: () => fetch(`/api/profile/${handle || 'me'}/achievements`).then((response) => response.json()),
  });
}

export function usePositions(status: 'open' | 'closed') {
  return useQuery({
    queryKey: ['positions', status],
    queryFn: () => fetch(`/api/profile/me/positions?status=${status}`).then((response) => response.json()),
  });
}
