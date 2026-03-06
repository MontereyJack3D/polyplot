'use client';

import { PlayCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { SlidePanel } from '@/components/panels/SlidePanel';

interface TradeReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: {
    market: string;
    entry: number;
    exit: number;
    date: string;
  } | null;
}

function buildReplay(entry: number, exit: number) {
  const points = 20;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const wave = Math.sin(i * 0.6) * 0.03;
    return {
      i,
      prob: Math.max(0.01, Math.min(0.99, entry + (exit - entry) * t + wave)),
    };
  });
}

export function TradeReplayModal({ isOpen, onClose, trade }: TradeReplayModalProps) {
  const series = trade ? buildReplay(trade.entry, trade.exit) : [];

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Trade Replay" subtitle={trade?.market} icon={<PlayCircle size={16} />} width="lg">
      {!trade ? <p className="text-sm text-muted-foreground">No trade selected.</p> : null}
      {trade ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-muted-foreground">Entry</p>
              <p className="font-mono mt-1">{(trade.entry * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-muted-foreground">Exit</p>
              <p className="font-mono mt-1">{(trade.exit * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-muted-foreground">Date</p>
              <p className="font-mono mt-1">{new Date(trade.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="h-72 rounded-lg border border-border bg-secondary/40 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="i" stroke="#6b7280" />
                <YAxis domain={[0, 1]} stroke="#6b7280" tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                <Area type="monotone" dataKey="prob" stroke="#00d4aa" fill="rgba(0,212,170,0.2)" />
                <ReferenceDot x={0} y={trade.entry} r={4} fill="#6366f1" />
                <ReferenceDot x={series.length - 1} y={trade.exit} r={4} fill="#00d4aa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}
