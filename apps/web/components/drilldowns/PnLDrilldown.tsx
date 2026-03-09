'use client';

import Link from 'next/link';

import { useDrillMetric } from '@/lib/hooks/use-dashboard';

interface PnLDrilldownProps {
  timeframe: string;
  venue: string;
}

export function PnLDrilldown({ timeframe, venue }: PnLDrilldownProps) {
  const query = useDrillMetric('totalPnL');

  if (query.isLoading) return <div className="text-sm text-muted-foreground">Loading PnL breakdown...</div>;
  if (query.isError || !query.data) return <div className="text-sm text-destructive">Failed to load PnL breakdown.</div>;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">Timeframe: {timeframe} · Venue: {venue}</p>
      <div className="space-y-2">
        {query.data.levels[0]?.rows.map((row) => (
          <Link
            key={row.label}
            href={`/app/profile#category-${row.label.toLowerCase().replace(/\s+/g, '-')}`}
            className="block rounded-lg border border-border bg-secondary/40 p-3 hover:bg-secondary/70 transition-colors"
          >
            <div className="flex items-center justify-between text-sm">
              <span>{row.label}</span>
              <span className={['font-mono', row.value >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                {row.value >= 0 ? '+' : '-'}${Math.abs(row.value).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Edge contribution {row.edgeContribution.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
