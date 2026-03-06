'use client';

import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { SlidePanel } from '@/components/panels/SlidePanel';

interface CategoryIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  category: string | null;
  rows: Array<{ category: string; edge: number; roi: number; winRate: number; trades: number; pnl?: number; momentum?: number }>;
  positions: Array<{ marketQuestion: string; side: string; status: string; entryProb: number | null; currentProb: number | null; realizedPnl: number; unrealizedPnl: number }>;
  publicView?: boolean;
}

export function CategoryIntelligencePanel({
  isOpen,
  onClose,
  category,
  rows,
  positions,
  publicView = false,
}: CategoryIntelligencePanelProps) {
  const [tab, setTab] = useState<'overview' | 'active' | 'history' | 'prob'>('overview');

  const row = rows.find((r) => r.category === category);

  const timeline = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: `W${i + 1}`,
        edge: (row?.edge ?? 50) + Math.sin(i / 2) * 5,
      })),
    [row?.edge]
  );

  const activePositions = positions.filter((p) => p.status === 'open');
  const historyPositions = positions.filter((p) => p.status !== 'open');

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `${category} Intelligence` : 'Category Intelligence'}
      subtitle="Category > Subcategory"
      icon={<BarChart3 size={16} />}
      width="lg"
    >
      {!category || !row ? (
        <p className="text-sm text-muted-foreground">Select a category to inspect intelligence.</p>
      ) : (
        <div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1 mb-4">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'active', label: 'Active Positions' },
              { key: 'history', label: 'Trade History' },
              { key: 'prob', label: 'Probability Skill' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as typeof tab)}
                className={[
                  'px-2.5 py-1 rounded-md text-xs transition-colors',
                  tab === item.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] text-muted-foreground">Edge</p>
                  <p className="font-mono mt-1">{row.edge.toFixed(1)}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] text-muted-foreground">ROI</p>
                  <p className="font-mono mt-1">{(row.roi * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] text-muted-foreground">Win Rate</p>
                  <p className="font-mono mt-1">{(row.winRate * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] text-muted-foreground">Trades</p>
                  <p className="font-mono mt-1">{row.trades}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[11px] text-muted-foreground">Momentum</p>
                  <p className="font-mono mt-1">{(row.momentum ?? 0).toFixed(1)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs text-muted-foreground mb-2">Performance Timeline</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Area dataKey="edge" type="monotone" stroke="#00d4aa" fill="rgba(0,212,170,0.15)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                Strategy insight: Edge is strongest when this category probability sits in mid-confidence bands.
              </div>
            </div>
          )}

          {tab === 'active' && (
            <div className="space-y-2">
              {activePositions.map((p, idx) => (
                <div key={`${p.marketQuestion}-${idx}`} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                  <p>{p.marketQuestion}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.side} · Entry {p.entryProb ? `${(p.entryProb * 100).toFixed(1)}%` : '—'} · Current{' '}
                    {p.currentProb ? `${(p.currentProb * 100).toFixed(1)}%` : '—'}
                  </p>
                </div>
              ))}
              {activePositions.length === 0 && <p className="text-sm text-muted-foreground">No active positions.</p>}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              {historyPositions.map((p, idx) => (
                <div key={`${p.marketQuestion}-${idx}`} className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                  <p>{p.marketQuestion}</p>
                  {!publicView && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Realized PnL {p.realizedPnl >= 0 ? '+' : '-'}${Math.abs(p.realizedPnl).toFixed(2)}
                    </p>
                  )}
                </div>
              ))}
              {historyPositions.length === 0 && <p className="text-sm text-muted-foreground">No trade history.</p>}
            </div>
          )}

          {tab === 'prob' && (
            <div className="grid grid-cols-5 gap-2">
              {['0-20', '20-40', '40-60', '60-80', '80-100'].map((band, index) => (
                <div key={band} className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                  <p className="text-muted-foreground">{band}%</p>
                  <p className="font-mono mt-1">{((row.winRate + index * 0.02) * 100).toFixed(0)}%</p>
                  <p className="text-muted-foreground mt-1">{Math.max(1, Math.floor(row.trades / 5))} trades</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SlidePanel>
  );
}
