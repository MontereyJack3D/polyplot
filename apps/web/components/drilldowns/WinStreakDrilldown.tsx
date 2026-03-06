'use client';

import Link from 'next/link';

import { useDrillMetric } from '@/lib/hooks/use-dashboard';

interface WinStreakDrilldownProps {
  timeframe: string;
  venue: string;
}

export function WinStreakDrilldown({ timeframe, venue }: WinStreakDrilldownProps) {
  const query = useDrillMetric('winStreak');

  if (query.isLoading) return <div className="text-sm text-muted-foreground">Loading streak breakdown...</div>;
  if (query.isError || !query.data) return <div className="text-sm text-destructive">Failed to load streak breakdown.</div>;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">Timeframe: {timeframe} · Venue: {venue}</p>
      <div className="space-y-2">
        {query.data.levels[0]?.rows.map((row) => (
          <Link
            key={row.label}
            href={`/profile#category-${row.label.toLowerCase().replace(/\s+/g, '-')}`}
            className="block rounded-lg border border-border bg-secondary/40 p-3 hover:bg-secondary/70 transition-colors"
          >
            <div className="flex items-center justify-between text-sm">
              <span>{row.label}</span>
              <span className="font-mono">{Math.round(row.value * 10)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Win-rate proxy {(row.value * 100).toFixed(1)}%</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
