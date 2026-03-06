'use client';

import { useMemo, useState } from 'react';

interface ActivityItem {
  id: string;
  ts: string;
  type: 'resolution' | 'trade' | 'achievement' | 'milestone';
  title: string;
  result: 'win' | 'loss' | 'pending' | null;
  pnl: number | null;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [filter, setFilter] = useState<'all' | 'trades' | 'wins' | 'losses' | 'milestones'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'trades') return items.filter((i) => i.type === 'trade');
    if (filter === 'wins') return items.filter((i) => i.result === 'win');
    if (filter === 'losses') return items.filter((i) => i.result === 'loss');
    return items.filter((i) => i.type === 'achievement' || i.type === 'milestone');
  }, [filter, items]);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Activity</h3>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1">
          {(['all', 'trades', 'wins', 'losses', 'milestones'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                'px-2 py-1 rounded text-[11px] transition-colors capitalize',
                filter === key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-sm">{item.title}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.type}</span>
              <span>{new Date(item.ts).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">No activity for this filter.</p>}
      </div>
    </div>
  );
}
