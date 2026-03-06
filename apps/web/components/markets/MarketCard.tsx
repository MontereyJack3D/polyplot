'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { ExternalLink, Star } from 'lucide-react';

interface MarketCardProps {
  market: {
    marketId: string;
    question: string;
    prob: number;
    venue: 'polymarket' | 'kalshi';
    category: string;
    volume24h: number | null;
    endTime: string | null;
    url?: string | null;
    hasPosition?: boolean;
  };
  watched: boolean;
  onToggleWatch: (marketId: string, next: boolean) => void;
  onOpen: (marketId: string) => void;
}

function formatCompactCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 }).format(value);
}

export function MarketCard({ market, watched, onToggleWatch, onOpen }: MarketCardProps) {
  const venueLabel = market.venue === 'polymarket' ? 'Polymarket' : 'Kalshi';
  const venueClass = market.venue === 'polymarket' ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 'bg-[#00b389]/10 text-[#00b389]';

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onOpen(market.marketId)} className="text-left flex-1">
          <p className="text-sm leading-5 line-clamp-2">{market.question}</p>
        </button>
        <button
          onClick={() => onToggleWatch(market.marketId, !watched)}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Star size={15} className={watched ? 'fill-primary text-primary' : ''} />
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="font-mono text-3xl text-primary">{((market.prob ?? 0) * 100).toFixed(1)}%</p>
        {market.url ? (
          <a href={market.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink size={14} />
          </a>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <span className={[venueClass, 'px-2 py-1 rounded-full'].join(' ')}>{venueLabel}</span>
        <span className="px-2 py-1 rounded-full bg-secondary text-muted-foreground">{market.category}</span>
      </div>

      <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 gap-2">
        <div>
          <p>Volume 24h</p>
          <p className="font-mono text-foreground mt-1">{formatCompactCurrency(market.volume24h)}</p>
        </div>
        <div>
          <p>Ends</p>
          <p className="font-mono text-foreground mt-1">
            {market.endTime ? formatDistanceToNowStrict(new Date(market.endTime), { addSuffix: true }) : '—'}
          </p>
        </div>
      </div>

      {market.hasPosition ? (
        <div className="mt-3 text-[11px] rounded-full bg-primary/10 text-primary px-2.5 py-1 inline-block">
          Your position: YES @ 0.42
        </div>
      ) : null}
    </div>
  );
}
