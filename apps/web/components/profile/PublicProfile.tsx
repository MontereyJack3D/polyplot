'use client';

import { GitCompareArrows, Share2 } from 'lucide-react';
import { useState } from 'react';

import { AchievementsSection } from '@/components/achievements/AchievementsSection';
import { CompareModal } from '@/components/modals/CompareModal';
import { ShareCardModal } from '@/components/modals/ShareCardModal';
import { CategoryIntelligencePanel } from '@/components/panels/CategoryIntelligencePanel';
import { DashboardSkeleton, ErrorState, ProfileEmpty } from '@/components/shared/page-states';
import { EdgeScoreRing } from '@/components/ui/edge-score-ring';
import { useAchievements, useEdgeMap, useProfileSummary } from '@/lib/hooks/use-profile';

import { CategoryTable } from './CategoryTable';
import { EdgeMap } from './EdgeMap';
import { ProbabilityHeatmap } from './ProbabilityHeatmap';

export function PublicProfile({ handle }: { handle: string }) {
  const summary = useProfileSummary(handle);
  const edgeMap = useEdgeMap(handle);
  const achievements = useAchievements(handle);

  const [compareOpen, setCompareOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (summary.isLoading) return <DashboardSkeleton />;
  if (summary.isError) return <ErrorState message="Failed to load public profile." onRetry={() => summary.refetch()} />;
  if (!summary.data) return <ProfileEmpty />;

  const profile = summary.data as {
    displayName: string | null;
    handle: string;
    edgeScore: number;
    winRate: number;
    totalTrades: number;
    strongestCategory: string | null;
    activeMarketsCount: number;
  };

  const edgeMapData = edgeMap.data as any;
  const categoryRows = (edgeMapData?.categoryEdge ?? []).map((row: any) => ({
    category: row.category,
    edge: row.edge,
    winRate: row.winRate,
    roi: row.roi ?? 0,
    trades: row.trades,
  }));

  const unlockedBadges = ((achievements.data as any)?.unlocked ?? []).map((a: any) => ({
    ...a,
    unlockedAt: a.unlockedAt,
    requirement: a.criteria?.type ?? 'Achievement criteria',
  }));

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center text-white text-lg">
          {(profile.displayName || profile.handle).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-medium">{profile.displayName || profile.handle}</h1>
          <p className="text-sm text-muted-foreground">@{profile.handle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShareOpen(true)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5">
            <Share2 size={13} /> Share Card
          </button>
          <button onClick={() => setCompareOpen(true)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs inline-flex items-center gap-1.5">
            <GitCompareArrows size={13} /> Compare with me
          </button>
        </div>
        <EdgeScoreRing score={profile.edgeScore} size={120} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="font-mono mt-2 text-2xl">{(profile.winRate * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Trades</p>
          <p className="font-mono mt-2 text-2xl">{profile.totalTrades}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Strongest Category</p>
          <p className="font-mono mt-2 text-2xl">{profile.strongestCategory || '—'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Active Markets</p>
          <p className="font-mono mt-2 text-2xl">{profile.activeMarketsCount}</p>
        </div>
      </div>

      <EdgeMap categories={categoryRows} />

      <CategoryTable
        rows={categoryRows}
        hidePnl
        onSelect={(category) => {
          setSelectedCategory(category);
          setCategoryPanelOpen(true);
        }}
      />

      <ProbabilityHeatmap bands={edgeMapData?.probabilityBands ?? []} />

      {unlockedBadges.length > 0 ? (
        <AchievementsSection achievements={unlockedBadges} />
      ) : (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium mb-3">Achievements</h3>
          <p className="text-sm text-muted-foreground">No public achievements yet.</p>
        </div>
      )}

      <CategoryIntelligencePanel
        isOpen={categoryPanelOpen}
        onClose={() => setCategoryPanelOpen(false)}
        category={selectedCategory}
        rows={categoryRows}
        positions={[]}
        publicView
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
