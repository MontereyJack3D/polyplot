'use client';

import { useMemo, useState } from 'react';

import { ErrorState } from '@/components/shared/page-states';
import { useHistory } from '@/lib/hooks/use-history';

import { TradeDetailModal } from '../modals/TradeDetailModal';
import { TradeReplayModal } from '../modals/TradeReplayModal';
import { TradeTable } from './TradeTable';

export function History() {
  const [outcome, setOutcome] = useState<'all' | 'win' | 'loss' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [replayOpen, setReplayOpen] = useState(false);

  const history = useHistory({ outcome, search, limit: 50 });

  const rows = ((history.data as { items?: Array<any> } | undefined)?.items ?? []) as Array<any>;
  const summary = ((history.data as { summary?: Record<string, number> } | undefined)?.summary ?? {}) as {
    totalTrades?: number;
    winRate?: number;
    totalPnl?: number;
    bestTrade?: number;
    worstTrade?: number;
  };

  const selectedTrade = useMemo(() => rows.find((r) => r.tradeId === selectedTradeId) ?? null, [rows, selectedTradeId]);

  if (history.isError) return <ErrorState message="Failed to load history" onRetry={() => history.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total Trades" value={String(summary.totalTrades ?? 0)} />
        <Stat label="Win Rate" value={`${((summary.winRate ?? 0) * 100).toFixed(1)}%`} />
        <Stat label="Total PnL" value={`${(summary.totalPnl ?? 0) >= 0 ? '+' : '-'}$${Math.abs(summary.totalPnl ?? 0).toFixed(2)}`} positive={(summary.totalPnl ?? 0) >= 0} />
        <Stat label="Best Trade" value={`+$${Math.abs(summary.bestTrade ?? 0).toFixed(2)}`} positive />
        <Stat label="Worst Trade" value={`-$${Math.abs(summary.worstTrade ?? 0).toFixed(2)}`} positive={false} />
      </div>

      <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap gap-2 items-center">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1">
          {(['all', 'win', 'loss', 'pending'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setOutcome(item)}
              className={['px-2.5 py-1 rounded-md text-xs capitalize', outcome === item ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search market"
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm min-w-[220px]"
        />
      </div>

      {history.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
      {rows.length === 0 && !history.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No trades found for the selected filters.
        </div>
      ) : (
        <TradeTable rows={rows} onSelect={setSelectedTradeId} />
      )}

      <TradeDetailModal
        isOpen={!!selectedTrade}
        onClose={() => setSelectedTradeId(null)}
        onOpenReplay={() => setReplayOpen(true)}
        trade={
          selectedTrade
            ? {
                tradeId: selectedTrade.tradeId,
                date: selectedTrade.date,
                market: selectedTrade.market,
                marketId: selectedTrade.marketId,
                side: selectedTrade.side,
                direction: selectedTrade.direction,
                price: selectedTrade.price,
                quantity: selectedTrade.quantity,
                fee: selectedTrade.fee,
                pnl: selectedTrade.pnl,
                edgeDelta: selectedTrade.edgeDelta,
                capture: selectedTrade.capture,
              }
            : null
        }
      />

      <TradeReplayModal
        isOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
        trade={
          selectedTrade
            ? {
                market: selectedTrade.market,
                entry: selectedTrade.price,
                exit: selectedTrade.price + (selectedTrade.capture ?? 0),
                date: selectedTrade.date,
              }
            : null
        }
      />
    </div>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={['mt-2 font-mono text-xl', positive === undefined ? 'text-foreground' : positive ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>{value}</p>
    </div>
  );
}
