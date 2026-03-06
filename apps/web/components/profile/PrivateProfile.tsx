'use client';

import { useMemo, useState } from 'react';
import { GitCompareArrows, Share2, Users } from 'lucide-react';

import { MetricDrilldown, type MetricKey } from '@/components/drilldowns/MetricDrilldown';
import { AchievementsSection } from '@/components/achievements/AchievementsSection';
import { CompareModal } from '@/components/modals/CompareModal';
import { ShareCardModal } from '@/components/modals/ShareCardModal';
import { CategoryIntelligencePanel } from '@/components/panels/CategoryIntelligencePanel';
import { DashboardSkeleton, ErrorState, ProfileEmpty } from '@/components/shared/page-states';
import { EdgeScoreRing } from '@/components/ui/edge-score-ring';
import { StatCard } from '@/components/ui/stat-card';
import {
  useAchievements,
  useCategorySnapshots,
  useEdgeMap,
  usePositions,
  useProfileSummary,
} from '@/lib/hooks/use-profile';
import { useActivity } from '@/lib/hooks/use-dashboard';

import { ActivityFeed } from './ActivityFeed';
import { CategoryTable } from './CategoryTable';
import { EdgeMap } from './EdgeMap';
import { PositionsTable } from './PositionsTable';
import { ProbabilityHeatmap } from './ProbabilityHeatmap';

export function PrivateProfile() {
  const summary = useProfileSummary();
  const edgeMap = useEdgeMap();
  const categories = useCategorySnapshots();
  const achievements = useAchievements();
  const activity = useActivity();
  const openPositions = usePositions('open');
  const closedPositions = usePositions('closed');

  const [positionsTab, setPositionsTab] = useState<'open' | 'closed'>('open');
  const [drillMetric, setDrillMetric] = useState<MetricKey | null>(null);
  const [metricOpen, setMetricOpen] = useState(false);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  if (summary.isLoading) return <DashboardSkeleton />;
  if (summary.isError) return <ErrorState message="Failed to load profile." onRetry={() => summary.refetch()} />;
  if (!summary.data) return <ProfileEmpty />;

  const profile = summary.data as {
    displayName: string | null;
    handle: string;
    edgeScore: number;
    winRate: number;
    roi: number;
    pnlTotal: number;
    totalTrades: number;
    winStreakCurrent: number;
    winStreakBest: number;
    momentum: number;
    activeMarketsCount: number;
    strongestCategory: string | null;
  };

  const categoryRows = (categories.data as { rows?: Array<any> } | undefined)?.rows ?? [];
  const edgeMapData = edgeMap.data as
    | {
        categoryEdge?: Array<{ category: string; edge: number; winRate: number; trades: number; roi?: number }>;
        probabilityBands?: Array<{ band: string; edgeContribution: number; winRate: number; trades: number; calibrationError?: number }>;
      }
    | undefined;

  const allBadges = useMemo(() => {
    const unlocked = ((achievements.data as any)?.unlocked ?? []).map((item: any) => ({
      ...item,
      unlockedAt: item.unlockedAt,
      requirement: item.criteria?.type ?? 'Achievement criteria',
    }));
    const inProgress = ((achievements.data as any)?.inProgress ?? []).map((item: any) => ({
      ...item,
      unlockedAt: null,
      requirement: item.criteria?.type ?? 'Achievement criteria',
      isHidden: item.isHidden ?? false,
    }));
    const hiddenLockedCount = (achievements.data as any)?.hiddenLockedCount ?? 0;
    const hidden = Array.from({ length: hiddenLockedCount }, (_, i) => ({
      name: `Hidden ${i + 1}`,
      family: 'hidden',
      tier: 'bronze',
      isHidden: true,
    }));

    return [...unlocked, ...inProgress, ...hidden];
  }, [achievements.data]);

  const statCards: Array<{ key: MetricKey; title: string; value: string; sub: string; trend: 'up' | 'down' | 'flat' }> = [
    { key: 'winRate', title: 'Win Rate', value: `${(profile.winRate * 100).toFixed(1)}%`, sub: `${profile.totalTrades} trades`, trend: 'up' },
    { key: 'roi', title: 'ROI', value: `${(profile.roi * 100).toFixed(1)}%`, sub: 'All-time', trend: profile.roi >= 0 ? 'up' : 'down' },
    {
      key: 'totalPnL',
      title: 'Total PnL',
      value: `${profile.pnlTotal >= 0 ? '+' : '-'}$${Math.abs(profile.pnlTotal).toFixed(2)}`,
      sub: 'Private metric',
      trend: profile.pnlTotal >= 0 ? 'up' : 'down',
    },
    { key: 'momentum', title: 'Momentum', value: profile.momentum.toFixed(0), sub: '7-day', trend: profile.momentum >= 50 ? 'up' : 'flat' },
    { key: 'winStreak', title: 'Win Streak', value: String(profile.winStreakCurrent), sub: `Best ${profile.winStreakBest}`, trend: profile.winStreakCurrent > 0 ? 'up' : 'flat' },
    { key: 'activeMarkets', title: 'Active Markets', value: String(profile.activeMarketsCount), sub: 'Open now', trend: 'flat' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center text-white text-lg">
          {(profile.displayName || profile.handle).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-medium">{profile.displayName || profile.handle}</h1>
          <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Users size={12} /> 1,247 followers · 86 following
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShareOpen(true)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5">
            <Share2 size={13} /> Share Profile
          </button>
          <button onClick={() => setCompareOpen(true)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5">
            <GitCompareArrows size={13} /> Compare
          </button>
        </div>
        <EdgeScoreRing score={profile.edgeScore} size={120} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <button
            key={card.key}
            onClick={() => {
              setDrillMetric(card.key);
              setMetricOpen(true);
            }}
            className="text-left"
          >
            <StatCard title={card.title} value={card.value} subValue={card.sub} trend={card.trend} />
          </button>
        ))}
      </div>

      <EdgeMap categories={(edgeMapData?.categoryEdge ?? []).map((row) => ({ ...row, edge: row.edge }))} />

      <CategoryTable
        rows={categoryRows}
        onSelect={(category) => {
          setSelectedCategory(category);
          setCategoryPanelOpen(true);
        }}
      />

      <ProbabilityHeatmap
        bands={edgeMapData?.probabilityBands ?? []}
        onSelectBand={() => {
          setDrillMetric('winRate');
          setMetricOpen(true);
        }}
      />

      <AchievementsSection achievements={allBadges} />

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 mb-4">
          <button
            onClick={() => setPositionsTab('open')}
            className={['px-2.5 py-1 rounded-md text-xs', positionsTab === 'open' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}
          >
            Active
          </button>
          <button
            onClick={() => setPositionsTab('closed')}
            className={['px-2.5 py-1 rounded-md text-xs', positionsTab === 'closed' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}
          >
            Closed
          </button>
        </div>

        <PositionsTable
          items={((positionsTab === 'open' ? openPositions.data : closedPositions.data) as any)?.items ?? []}
          mode={positionsTab}
        />
      </div>

      <ActivityFeed items={activity.data?.items ?? []} />

      <MetricDrilldown isOpen={metricOpen} onClose={() => setMetricOpen(false)} metricKey={drillMetric} />

      <CategoryIntelligencePanel
        isOpen={categoryPanelOpen}
        onClose={() => setCategoryPanelOpen(false)}
        category={selectedCategory}
        rows={categoryRows}
        positions={((positionsTab === 'open' ? openPositions.data : closedPositions.data) as any)?.items ?? []}
      />

      <ShareCardModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        profile={{
          displayName: profile.displayName,
          handle: profile.handle,
          edgeScore: profile.edgeScore,
          winRate: profile.winRate,
          totalTrades: profile.totalTrades,
          strongestCategory: profile.strongestCategory,
        }}
      />

      <CompareModal isOpen={compareOpen} onClose={() => setCompareOpen(false)} baseHandle={profile.handle} edgeScore={profile.edgeScore} />
    </div>
  );
}
