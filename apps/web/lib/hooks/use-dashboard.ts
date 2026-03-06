'use client';

import { useQuery } from '@tanstack/react-query';

import type {
  ActivityResponse,
  DashboardSummaryResponse,
  DrilldownResponse,
  ProbabilitySkillResponse,
} from '@polyplot/core';

import { useFilterStore } from '@/lib/stores/filter-store';

export function useDashboardSummary() {
  const { timeframe, venue } = useFilterStore();

  return useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboard-summary', timeframe, venue],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/summary?timeframe=${timeframe}&venue=${venue}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard summary');
      return res.json();
    },
  });
}

export function useProbabilitySkill() {
  const { timeframe, venue } = useFilterStore();

  return useQuery<ProbabilitySkillResponse>({
    queryKey: ['probability-skill', timeframe, venue],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/probability-skill?timeframe=${timeframe}&venue=${venue}`);
      if (!res.ok) throw new Error('Failed to fetch probability skill');
      return res.json();
    },
  });
}

export function useActivity() {
  return useQuery<ActivityResponse>({
    queryKey: ['activity'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/activity?limit=20');
      if (!res.ok) throw new Error('Failed to fetch activity');
      return res.json();
    },
  });
}

export function useEdgeHistory() {
  const { timeframe } = useFilterStore();

  return useQuery<Array<{ date: string; score: number }>>({
    queryKey: ['edge-history', timeframe],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/edge-history?timeframe=${timeframe}`);
      if (!res.ok) throw new Error('Failed to fetch edge history');
      return res.json();
    },
  });
}

export function useDrillMetric(metric: string) {
  const { timeframe, venue } = useFilterStore();

  return useQuery<DrilldownResponse>({
    queryKey: ['drill-metric', metric, timeframe, venue],
    queryFn: async () => {
      const res = await fetch(`/api/drill/metric?metric=${metric}&timeframe=${timeframe}&venue=${venue}`);
      if (!res.ok) throw new Error('Failed to fetch drill metric');
      return res.json();
    },
  });
}

export function useCategorySnapshots() {
  const { timeframe, venue } = useFilterStore();

  return useQuery<DrilldownResponse>({
    queryKey: ['category-snapshots', timeframe, venue],
    queryFn: async () => {
      const res = await fetch(`/api/drill/metric?metric=roi&timeframe=${timeframe}&venue=${venue}`);
      if (!res.ok) throw new Error('Failed to fetch category snapshots');
      return res.json();
    },
  });
}
