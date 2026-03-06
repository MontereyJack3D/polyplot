'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Target, TrendingUp, Zap } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DashboardSummaryResponse, ProbabilitySkillResponse } from '@polyplot/core';

import { MetricDrilldown, type MetricKey } from '@/components/drilldowns/MetricDrilldown';
import {
  DashboardEmpty,
  DashboardSkeleton,
  ErrorState,
  usePageState,
} from '@/components/shared/page-states';
import { EdgeScoreRing } from '@/components/ui/edge-score-ring';
import { StatCard } from '@/components/ui/stat-card';
import {
  useActivity,
  useCategorySnapshots,
  useDashboardSummary,
  useEdgeHistory,
  useProbabilitySkill,
} from '@/lib/hooks/use-dashboard';

interface Insight {
  icon: 'target' | 'trending-up' | 'zap';
  title: string;
  description: string;
}

function generateInsights(summary: DashboardSummaryResponse, probSkill: ProbabilitySkillResponse): Insight[] {
  const insights: Insight[] = [];

  const bestBand = probSkill.bands.reduce(
    (best, band) => (band.edgeContribution > best.edgeContribution ? band : best),
    probSkill.bands[0] || {
      band: '40-60',
      trades: 0,
      winRate: 0,
      roi: 0,
      edgeContribution: 0,
      logLossAvg: 0,
      calibrationError: 0,
    }
  );

  if (bestBand.trades > 5) {
    insights.push({
      icon: 'target',
      title: `Strongest in ${bestBand.band}% range`,
      description: `Your edge contribution is ${bestBand.edgeContribution.toFixed(1)} in this band with ${
        bestBand.winRate ? (bestBand.winRate * 100).toFixed(0) : '—'
      }% win rate.`,
    });
  }

  if (summary.momentum > 60) {
    insights.push({
      icon: 'trending-up',
      title: 'Momentum is building',
      description: `Your recent performance is trending upward with a momentum score of ${summary.momentum.toFixed(0)}.`,
    });
  }

  if (summary.winStreakCurrent >= 3) {
    insights.push({
      icon: 'zap',
      title: `${summary.winStreakCurrent}-trade win streak active`,
      description: `You're on a roll. Your best streak is ${summary.winStreakBest} consecutive wins.`,
    });
  }

  while (insights.length < 3) {
    insights.push({
      icon: 'trending-up',
      title: 'Keep building your track record',
      description: `You have ${summary.activeMarketsCount} active markets. More resolved trades sharpen your Edge Score.`,
    });
  }

  return insights.slice(0, 3);
}

function iconForInsight(icon: Insight['icon']) {
  if (icon === 'target') return <Target size={16} className="text-primary" />;
  if (icon === 'zap') return <Zap size={16} className="text-primary" />;
  return <TrendingUp size={16} className="text-primary" />;
}

export function Dashboard() {
  const summary = useDashboardSummary();
  const probSkill = useProbabilitySkill();
  const activity = useActivity();
  const edgeHistory = useEdgeHistory();
  const categorySnapshots = useCategorySnapshots();

  const [metricOpen, setMetricOpen] = useState(false);
  const [metricKey, setMetricKey] = useState<MetricKey | null>(null);

  const pageState = usePageState({
    isLoading: summary.isLoading,
    isError: summary.isError,
    data: summary.data,
  });

  const insights = useMemo(() => {
    if (!summary.data || !probSkill.data) return [];
    return generateInsights(summary.data, probSkill.data);
  }, [summary.data, probSkill.data]);

  const velocityData = useMemo(() => {
    const rows = activity.data?.items ?? [];
    const buckets = new Map<string, { date: string; pnl: number; trades: number }>();

    for (const item of rows) {
      const date = new Date(item.ts).toISOString().split('T')[0];
      if (!buckets.has(date)) {
        buckets.set(date, { date, pnl: 0, trades: 0 });
      }
      const bucket = buckets.get(date)!;
      bucket.pnl += item.pnl ?? 0;
      bucket.trades += item.type === 'trade' ? 1 : 0;
    }

    return Array.from(buckets.values()).slice(-7);
  }, [activity.data]);

  if (pageState.state === 'loading') return <DashboardSkeleton />;
  if (pageState.state === 'error') return <ErrorState onRetry={() => summary.refetch()} message="Dashboard query failed." />;
  if (pageState.state === 'empty' || !summary.data) return <DashboardEmpty />;

  const data = summary.data;
  const categoryRows = categorySnapshots.data?.levels?.[0]?.rows ?? [];

  const statCards: Array<{ key: MetricKey; title: string; value: string; sub: string; trend: 'up' | 'down' | 'flat' }> = [
    {
      key: 'winRate',
      title: 'Win Rate',
      value: `${(data.winRate * 100).toFixed(1)}%`,
      sub: `${data.winStreakCurrent} current streak`,
      trend: data.winRate >= 0.5 ? 'up' : 'down',
    },
    {
      key: 'roi',
      title: 'ROI',
      value: `${(data.roi * 100).toFixed(1)}%`,
      sub: `Realized ${(data.pnlRealized ?? 0).toFixed(2)}`,
      trend: data.roi >= 0 ? 'up' : 'down',
    },
    {
      key: 'totalPnL',
      title: 'Total PnL',
      value: `${data.pnlTotal >= 0 ? '+' : '-'}$${Math.abs(data.pnlTotal).toFixed(2)}`,
      sub: `${data.pnlRealized >= 0 ? '+' : '-'}$${Math.abs(data.pnlRealized).toFixed(2)} realized`,
      trend: data.pnlTotal >= 0 ? 'up' : 'down',
    },
    {
      key: 'momentum',
      title: 'Momentum',
      value: data.momentum.toFixed(0),
      sub: data.momentum > 60 ? 'Trending up' : 'Flat',
      trend: data.momentum > 50 ? 'up' : 'flat',
    },
    {
      key: 'winStreak',
      title: 'Win Streak',
      value: String(data.winStreakCurrent),
      sub: `Best ${data.winStreakBest}`,
      trend: data.winStreakCurrent > 0 ? 'up' : 'flat',
    },
    {
      key: 'activeMarkets',
      title: 'Active Markets',
      value: String(data.activeMarketsCount),
      sub: `${data.venue} scope`,
      trend: 'flat',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-3 bg-card border border-border rounded-xl p-6 flex items-center justify-center">
          <EdgeScoreRing score={data.edgeScore} />
        </div>

        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <button
              key={card.key}
              onClick={() => {
                setMetricKey(card.key);
                setMetricOpen(true);
              }}
              className="text-left"
            >
              <StatCard title={card.title} value={card.value} subValue={card.sub} trend={card.trend} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-7 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Edge Score Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={edgeHistory.data ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#6b7280"
                />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    background: '#12141a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#00d4aa" fill="url(#edgeArea)" strokeWidth={2} />
                <defs>
                  <linearGradient id="edgeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Performance Velocity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    background: '#12141a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                  }}
                />
                <Bar dataKey="pnl" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 xl:col-span-4 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Activity Feed</h3>
          <div className="space-y-2">
            {(activity.data?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              activity.data?.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-sm">{item.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.type}</span>
                    <span>{new Date(item.ts).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={`${insight.title}-${idx}`} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {iconForInsight(insight.icon)}
                  <span>{insight.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-4">Category Edge</h3>
          <div className="space-y-3">
            {categoryRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category data yet.</p>
            ) : (
              categoryRows.slice(0, 8).map((row, idx) => {
                const max = Math.max(...categoryRows.map((r) => Math.abs(r.edgeContribution || 1)), 1);
                const width = Math.max(6, (Math.abs(row.edgeContribution) / max) * 100);

                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>{row.label}</span>
                      <span className="font-mono">{row.edgeContribution.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: idx * 0.05, duration: 0.35 }}
                        className={[
                          'h-full rounded-full',
                          row.edgeContribution >= 0 ? 'bg-[#00d4aa]' : 'bg-[#ef4444]',
                        ].join(' ')}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <MetricDrilldown isOpen={metricOpen} onClose={() => setMetricOpen(false)} metricKey={metricKey} />
    </div>
  );
}
