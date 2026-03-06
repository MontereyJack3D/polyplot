'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { ErrorState } from '@/components/shared/page-states';
import { useArbitrage, useMarketsSearch, useOpportunities } from '@/lib/hooks/use-markets';
import { useWatchlistStore } from '@/lib/stores/watchlist-store';

import { ArbitrageCard } from './ArbitrageCard';
import { BrowseFilterBar, type BrowseFilters } from './BrowseFilterBar';
import { MarketCard } from './MarketCard';
import { OpportunityCard } from './OpportunityCard';
import { MarketPreviewModal } from '../modals/MarketPreviewModal';

export function Markets() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'browse' | 'opportunities' | 'arbitrage' | 'watchlist'>('browse');
  const [cursor, setCursor] = useState<string | null>(null);
  const [previewMarketId, setPreviewMarketId] = useState<string | null>(null);
  const [items, setItems] = useState<Array<any>>([]);
  const [filters, setFilters] = useState<BrowseFilters>({ q: '', status: 'open', sort: 'volume' });

  const search = useMarketsSearch({
    q: filters.q,
    status: filters.status,
    sort: filters.sort,
    cursor,
  });
  const opportunities = useOpportunities();
  const arbitrage = useArbitrage();
  const watchedMarketIds = useWatchlistStore((state) => state.watchedMarketIds);
  const addToWatchlist = useWatchlistStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useWatchlistStore((state) => state.removeFromWatchlist);
  const watchlist = useMemo(() => new Set(watchedMarketIds), [watchedMarketIds]);

  const activeData = tab === 'browse' || tab === 'watchlist' ? search : tab === 'opportunities' ? opportunities : arbitrage;

  useEffect(() => {
    const marketIdFromQuery = searchParams.get('marketId');
    if (marketIdFromQuery) setPreviewMarketId(marketIdFromQuery);
  }, [searchParams]);

  useEffect(() => {
    setCursor(null);
    setItems([]);
  }, [tab, filters.q, filters.sort, filters.status]);

  useEffect(() => {
    const nextItems = (search.data as { items?: Array<any> } | undefined)?.items ?? [];
    const filteredItems = tab === 'watchlist' ? nextItems.filter((entry) => watchlist.has(entry.marketId)) : nextItems;
    if (!filteredItems.length) {
      if (!cursor) setItems([]);
      return;
    }

    if (!cursor) {
      setItems(filteredItems);
      return;
    }

    setItems((prev) => {
      const seen = new Set(prev.map((entry) => entry.marketId));
      const merged = [...prev];
      for (const entry of filteredItems) {
        if (!seen.has(entry.marketId)) merged.push(entry);
      }
      return merged;
    });
  }, [cursor, search.data, tab, watchlist]);

  useEffect(() => {
    if (tab !== 'watchlist') return;
    setItems((prev) => prev.filter((entry) => watchlist.has(entry.marketId)));
  }, [tab, watchlist]);

  if (activeData.isError) {
    return <ErrorState message="Failed to load markets." onRetry={() => activeData.refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1">
        {(['browse', 'opportunities', 'arbitrage', 'watchlist'] as const).map((item) => (
          <button
            key={item}
            onClick={() => {
              setTab(item);
              setCursor(null);
            }}
            className={[
              'px-3 py-1.5 rounded-md text-xs capitalize',
              tab === item ? 'bg-primary/15 text-primary' : 'text-muted-foreground',
            ].join(' ')}
          >
            {item}
          </button>
        ))}
      </div>

      {(tab === 'browse' || tab === 'watchlist') && <BrowseFilterBar value={filters} onChange={setFilters} />}

      {activeData.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}

      {(tab === 'browse' || tab === 'watchlist') && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((market) => (
              <MarketCard
                key={market.marketId}
                market={market}
                watched={watchlist.has(market.marketId)}
                onToggleWatch={(marketId, next) => {
                  if (next) addToWatchlist(marketId);
                  else removeFromWatchlist(marketId);
                }}
                onOpen={(marketId) => setPreviewMarketId(marketId)}
              />
            ))}
          </div>

          {!search.isLoading && items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No markets found for current filters.
            </div>
          ) : null}

          {((search.data as { nextCursor?: string | null } | undefined)?.nextCursor ?? null) ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setCursor((search.data as { nextCursor?: string | null }).nextCursor ?? null)}
                className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              >
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}

      {tab === 'opportunities' && (
        <div className="space-y-3">
          {((opportunities.data as { items?: Array<any> } | undefined)?.items ?? []).map((item) => (
            <OpportunityCard
              key={item.marketId}
              question={item.question}
              category={item.category}
              venue={item.venue}
              currentProb={item.currentProb}
              opportunityScore={item.opportunityScore}
              explanation={item.explanation}
              recommendedAction={item.recommendedAction}
              onClick={() => setPreviewMarketId(item.marketId)}
            />
          ))}
          {!((opportunities.data as { items?: unknown[] } | undefined)?.items ?? []).length && (
            <p className="text-sm text-muted-foreground">No opportunities available yet.</p>
          )}
        </div>
      )}

      {tab === 'arbitrage' && (
        <div className="space-y-3">
          {((arbitrage.data as { items?: Array<any> } | undefined)?.items ?? []).map((item) => (
            <ArbitrageCard key={item.id} item={item} />
          ))}
          {!((arbitrage.data as { items?: unknown[] } | undefined)?.items ?? []).length && (
            <p className="text-sm text-muted-foreground">No arbitrage opportunities currently active.</p>
          )}
        </div>
      )}

      <MarketPreviewModal marketId={previewMarketId} isOpen={!!previewMarketId} onClose={() => setPreviewMarketId(null)} />
    </div>
  );
}
