'use client';

import { Activity, ExternalLink, ShieldAlert, Target } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { SlidePanel } from '@/components/panels/SlidePanel';
import { useMarketIntelligence } from '@/lib/hooks/use-markets';

interface MarketPreviewModalProps {
  marketId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarketPreviewModal({ marketId, isOpen, onClose }: MarketPreviewModalProps) {
  const intelligence = useMarketIntelligence(marketId, isOpen);

  const data = intelligence.data as
    | {
        market: { question: string; category: string; subcategory: string | null; endTime: string | null };
        prices: { current: { venue: string; prob: number }; series: Array<{ ts: string; prob: number; volume24h: number | null }> };
        edgeAlignment: {
          categoryEdgeScore: number;
          band: string;
          bandWinRate: number;
          bandRoi: number;
          similarTrades: number;
          alignment: 'strong' | 'moderate' | 'weak' | 'no_data';
        } | null;
        venueComparison: {
          venues: Array<{ venue: string; yes: number; no: number; feesBps: number }>;
          spread: number;
          arbDetected: boolean;
        } | null;
        signals: Array<{ type: string; severity: number; label: string; explain: string }>;
        position: { hasPosition: boolean; side?: string; entryProb?: number; currentProb?: number; pnl?: number };
        relatedMarkets: Array<{ marketId: string; question: string; prob: number }>;
      }
    | undefined;

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={data?.market.question ?? 'Market Intelligence'} subtitle="Market preview" icon={<Activity size={16} />} width="lg">
      {intelligence.isLoading ? <p className="text-sm text-muted-foreground">Loading market intelligence...</p> : null}
      {intelligence.isError ? <p className="text-sm text-destructive">Failed to load market intelligence.</p> : null}
      {data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Current YES</p>
              <p className="font-mono text-xl mt-1 text-primary">{(data.prices.current.prob * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Venue</p>
              <p className="font-mono text-xl mt-1 capitalize">{data.prices.current.venue}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-[11px] text-muted-foreground">Category</p>
              <p className="font-mono text-xl mt-1">{data.market.category}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground mb-2">Probability Trend</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.prices.series}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="ts" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                  <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} labelFormatter={(label) => new Date(label).toLocaleString()} />
                  <Area type="monotone" dataKey="prob" stroke="#00d4aa" fill="rgba(0,212,170,0.18)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data.edgeAlignment ? (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5"><Target size={12} /> Edge Alignment</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div><p className="text-muted-foreground">Category Edge</p><p className="font-mono mt-1">{data.edgeAlignment.categoryEdgeScore.toFixed(1)}</p></div>
                <div><p className="text-muted-foreground">Band</p><p className="font-mono mt-1">{data.edgeAlignment.band}</p></div>
                <div><p className="text-muted-foreground">Band Win Rate</p><p className="font-mono mt-1">{(data.edgeAlignment.bandWinRate * 100).toFixed(1)}%</p></div>
                <div><p className="text-muted-foreground">Band ROI</p><p className="font-mono mt-1">{(data.edgeAlignment.bandRoi * 100).toFixed(1)}%</p></div>
                <div><p className="text-muted-foreground">Similar Trades</p><p className="font-mono mt-1">{data.edgeAlignment.similarTrades}</p></div>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground mb-2 inline-flex items-center gap-1.5"><ShieldAlert size={12} /> Signals</p>
            <div className="space-y-2">
              {data.signals.length ? data.signals.map((signal) => (
                <div key={`${signal.type}-${signal.label}`} className="rounded-md border border-border bg-background/30 p-2.5">
                  <p className="text-sm">{signal.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{signal.explain}</p>
                </div>
              )) : <p className="text-xs text-muted-foreground">No active signals.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground mb-2">Venue Comparison</p>
              {data.venueComparison ? (
                <div className="space-y-2 text-xs">
                  {data.venueComparison.venues.map((venue) => (
                    <div key={venue.venue} className="flex items-center justify-between">
                      <span className="text-muted-foreground capitalize">{venue.venue} YES</span>
                      <span className="font-mono">{(venue.yes * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Spread</span>
                    <span className="font-mono text-primary">{(data.venueComparison.spread * 100).toFixed(2)}%</span>
                  </div>
                  {data.venueComparison.arbDetected ? (
                    <p className="text-[11px] text-primary">Arbitrage signal detected across venues.</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No mapped cross-venue market found yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground mb-2">Your Position</p>
              {data.position.hasPosition ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Side</span><span className="font-mono">{data.position.side}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Entry</span><span className="font-mono">{data.position.entryProb !== undefined ? `${(data.position.entryProb * 100).toFixed(1)}%` : '—'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Current</span><span className="font-mono">{data.position.currentProb !== undefined ? `${(data.position.currentProb * 100).toFixed(1)}%` : '—'}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">PnL</span><span className={['font-mono', (data.position.pnl ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>{(data.position.pnl ?? 0) >= 0 ? '+' : '-'}${Math.abs(data.position.pnl ?? 0).toFixed(2)}</span></div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No active position in this market.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <p className="text-xs text-muted-foreground mb-2">Related Markets</p>
            <div className="space-y-2">
              {data.relatedMarkets.length ? data.relatedMarkets.map((market) => (
                <a key={market.marketId} href={`/markets?marketId=${market.marketId}`} className="block rounded-md border border-border bg-background/30 p-2.5 hover:border-primary/40 transition-colors">
                  <p className="text-sm line-clamp-1">{market.question}</p>
                </a>
              )) : <p className="text-xs text-muted-foreground">No related markets found.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <a
              href={data.prices.current.venue === 'kalshi' ? 'https://kalshi.com' : 'https://polymarket.com'}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              Trade on {data.prices.current.venue === 'kalshi' ? 'Kalshi' : 'Polymarket'} <ExternalLink size={14} />
            </a>
            <button className="rounded-lg border border-border bg-secondary py-2.5 text-sm">Add to watchlist</button>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}
