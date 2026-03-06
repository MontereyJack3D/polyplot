'use client';

import { CalendarDays, Filter, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useFilterStore } from '@/lib/stores/filter-store';

const timeframes = [
  { label: '7D', value: '7D' as const },
  { label: '30D', value: '30D' as const },
  { label: 'YTD', value: 'YTD' as const },
  { label: '1Y', value: '1Y' as const },
  { label: 'ALL', value: 'ALL' as const },
  { label: 'Custom', value: 'custom' as const },
];

const venues = [
  { label: 'Combined', value: 'combined' as const },
  { label: 'Polymarket', value: 'polymarket' as const },
  { label: 'Kalshi', value: 'kalshi' as const },
];

const categories = ['All', 'Politics', 'Sports', 'Crypto', 'Macro', 'Finance', 'Tech', 'Culture', 'Science'] as const;

export function GlobalFilterBar() {
  const {
    timeframe,
    venue,
    mode,
    category,
    customRange,
    setTimeframe,
    setVenue,
    setMode,
    setCategory,
    setCustomRange,
    resetFilters,
  } = useFilterStore();

  const [showCustomDates, setShowCustomDates] = useState(false);

  const chips = useMemo(() => {
    const values: string[] = [];
    values.push(`Time: ${timeframe === 'custom' ? 'Custom' : timeframe}`);
    values.push(`Venue: ${venue}`);
    values.push(`Mode: ${mode}`);
    if (category) values.push(`Category: ${category}`);
    if (customRange) values.push(`${customRange.start} to ${customRange.end}`);
    return values;
  }, [timeframe, venue, mode, category, customRange]);

  return (
    <div className="h-11 bg-[#0d0f14]/80 backdrop-blur-md border-b border-border/60 px-4 flex items-center gap-3 overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shrink-0">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={[
              'px-2.5 py-1 rounded-md text-xs transition-colors',
              timeframe === tf.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shrink-0">
        {venues.map((entry) => (
          <button
            key={entry.value}
            onClick={() => setVenue(entry.value)}
            className={[
              'px-2.5 py-1 rounded-md text-xs transition-colors',
              venue === entry.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 shrink-0">
        <button
          onClick={() => setMode('normal')}
          className={[
            'px-2.5 py-1 rounded-md text-xs transition-colors',
            mode === 'normal' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Normal
        </button>
        <button
          onClick={() => setMode('pro')}
          className={[
            'px-2.5 py-1 rounded-md text-xs transition-colors',
            mode === 'pro' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          Pro
        </button>
      </div>

      <select
        value={category ?? 'All'}
        onChange={(event) => setCategory(event.target.value === 'All' ? null : event.target.value)}
        className="h-8 rounded-lg border border-border bg-secondary/60 px-2.5 text-xs text-foreground"
      >
        {categories.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>

      <div className="relative shrink-0">
        <button
          onClick={() => setShowCustomDates((v) => !v)}
          className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 text-xs text-foreground"
        >
          <CalendarDays size={13} />
          Custom Range
        </button>
        {showCustomDates && (
          <div className="absolute top-10 left-0 z-30 w-72 rounded-xl border border-border bg-card p-3 shadow-2xl">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block">Start date</label>
              <input
                type="date"
                value={customRange?.start ?? ''}
                onChange={(e) =>
                  setCustomRange({
                    start: e.target.value,
                    end: customRange?.end ?? e.target.value,
                  })
                }
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground"
              />
            </div>
            <div className="space-y-2 mt-3">
              <label className="text-xs text-muted-foreground block">End date</label>
              <input
                type="date"
                value={customRange?.end ?? ''}
                onChange={(e) =>
                  setCustomRange({
                    start: customRange?.start ?? e.target.value,
                    end: e.target.value,
                  })
                }
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground"
              />
            </div>
            <button
              onClick={() => {
                setTimeframe('custom');
                setShowCustomDates(false);
              }}
              className="mt-3 w-full rounded-lg bg-primary text-primary-foreground py-2 text-xs font-medium"
            >
              Apply custom range
            </button>
          </div>
        )}
      </div>

      <button
        onClick={resetFilters}
        className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
      >
        <RotateCcw size={13} />
        Reset
      </button>

      <div className="ml-auto flex items-center gap-2 overflow-x-auto">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[11px] text-muted-foreground whitespace-nowrap"
          >
            <Filter size={11} /> {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
