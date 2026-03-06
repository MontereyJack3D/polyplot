'use client';

import { Search } from 'lucide-react';

export interface BrowseFilters {
  q: string;
  status: 'open' | 'closing-soon' | 'resolved';
  sort: 'volume' | 'probability' | 'newest';
}

interface BrowseFilterBarProps {
  value: BrowseFilters;
  onChange: (next: BrowseFilters) => void;
}

export function BrowseFilterBar({ value, onChange }: BrowseFilterBarProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
        <input
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="Search markets"
          className="w-full bg-secondary border border-border rounded-lg pl-8 pr-3 py-2 text-sm"
        />
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1">
        {(['open', 'closing-soon', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => onChange({ ...value, status })}
            className={[
              'px-2.5 py-1 rounded-md text-xs capitalize',
              value.status === status ? 'bg-primary/15 text-primary' : 'text-muted-foreground',
            ].join(' ')}
          >
            {status.replace('-', ' ')}
          </button>
        ))}
      </div>

      <select
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value as BrowseFilters['sort'] })}
        className="bg-secondary border border-border rounded-lg px-2.5 py-2 text-xs"
      >
        <option value="volume">Sort: Volume</option>
        <option value="probability">Sort: Probability</option>
        <option value="newest">Sort: Newest</option>
      </select>
    </div>
  );
}
