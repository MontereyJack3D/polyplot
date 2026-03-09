'use client';

import Link from 'next/link';

import { useDrillMetric } from '@/lib/hooks/use-dashboard';

interface ActiveMarketsDrilldownProps {
  timeframe: string;
  venue: string;
}

export function ActiveMarketsDrilldown({ timeframe, venue }: ActiveMarketsDrilldownProps) {
  const query = useDrillMetric('activeMarkets');

  if (query.isLoading) return <div className="text-sm text-muted-foreground">Loading active market breakdown...</div>;
  if (query.isError || !query.data) return <div className="text-sm text-destructive">Failed to load active market breakdown.</div>;

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
              <span className="font-mono">{Math.round(row.value)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{row.trades} trades tracked</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
