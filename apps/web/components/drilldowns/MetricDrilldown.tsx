'use client';

import { Activity, DollarSign, Flame, Gauge, Percent, TrendingUp } from 'lucide-react';

import { useFilterStore } from '@/lib/stores/filter-store';
import { SlidePanel } from '@/components/panels/SlidePanel';

import { ActiveMarketsDrilldown } from './ActiveMarketsDrilldown';
import { MomentumDrilldown } from './MomentumDrilldown';
import { PnLDrilldown } from './PnLDrilldown';
import { ROIDrilldown } from './ROIDrilldown';
import { WinRateDrilldown } from './WinRateDrilldown';
import { WinStreakDrilldown } from './WinStreakDrilldown';

export type MetricKey = 'winRate' | 'roi' | 'totalPnL' | 'momentum' | 'winStreak' | 'activeMarkets';

interface MetricDrilldownProps {
  isOpen: boolean;
  onClose: () => void;
  metricKey: MetricKey | null;
}

const metricMeta: Record<MetricKey, { title: string; icon: React.ReactNode }> = {
  winRate: { title: 'Win Rate', icon: <Percent size={16} /> },
  roi: { title: 'ROI', icon: <TrendingUp size={16} /> },
  totalPnL: { title: 'Total PnL', icon: <DollarSign size={16} /> },
  momentum: { title: 'Momentum', icon: <Gauge size={16} /> },
  winStreak: { title: 'Win Streak', icon: <Flame size={16} /> },
  activeMarkets: { title: 'Active Markets', icon: <Activity size={16} /> },
};

export function MetricDrilldown({ isOpen, onClose, metricKey }: MetricDrilldownProps) {
  const { timeframe, venue } = useFilterStore();

  if (!metricKey) return null;

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`${metricMeta[metricKey].title} Drilldown`}
      subtitle="Category-level performance overview"
      icon={metricMeta[metricKey].icon}
      width="lg"
    >
      {metricKey === 'winRate' && <WinRateDrilldown timeframe={timeframe} venue={venue} />}
      {metricKey === 'roi' && <ROIDrilldown timeframe={timeframe} venue={venue} />}
      {metricKey === 'totalPnL' && <PnLDrilldown timeframe={timeframe} venue={venue} />}
      {metricKey === 'momentum' && <MomentumDrilldown timeframe={timeframe} venue={venue} />}
      {metricKey === 'winStreak' && <WinStreakDrilldown timeframe={timeframe} venue={venue} />}
      {metricKey === 'activeMarkets' && <ActiveMarketsDrilldown timeframe={timeframe} venue={venue} />}
    </SlidePanel>
  );
}
