'use client';

import { ExternalLink, Eye } from 'lucide-react';

import { SlidePanel } from '@/components/panels/SlidePanel';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReplay: () => void;
  trade: {
    tradeId: string;
    date: string;
    market: string;
    marketId: string;
    side: 'YES' | 'NO';
    direction: 'buy' | 'sell';
    price: number;
    quantity: number;
    fee: number;
    pnl: number;
    edgeDelta: number | null;
    capture: number | null;
  } | null;
}

export function TradeDetailModal({ isOpen, onClose, onOpenReplay, trade }: TradeDetailModalProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Trade Details" subtitle={trade?.market} icon={<Eye size={16} />} width="md">
      {!trade ? <p className="text-sm text-muted-foreground">No trade selected.</p> : null}
      {trade ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-border bg-secondary/40 p-3"><p className="text-muted-foreground">Side</p><p className="font-mono mt-1">{trade.side}</p></div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3"><p className="text-muted-foreground">Direction</p><p className="font-mono mt-1 uppercase">{trade.direction}</p></div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3"><p className="text-muted-foreground">Entry/Exit Prob</p><p className="font-mono mt-1">{(trade.price * 100).toFixed(1)}%</p></div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3"><p className="text-muted-foreground">Quantity</p><p className="font-mono mt-1">{trade.quantity.toFixed(2)}</p></div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3"><p className="text-muted-foreground">PnL</p><p className={["font-mono mt-1", trade.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>{trade.pnl >= 0 ? '+' : '-'}${Math.abs(trade.pnl).toFixed(2)}</p></div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3"><p className="text-muted-foreground">Edge Delta</p><p className="font-mono mt-1">{trade.edgeDelta?.toFixed(2) ?? '—'}</p></div>
          </div>

          <div className="flex gap-2">
            <button onClick={onOpenReplay} className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium">Trade Replay</button>
            <a href={`/markets?marketId=${trade.marketId}`} className="flex-1 rounded-lg border border-border bg-secondary py-2.5 text-sm inline-flex items-center justify-center gap-1.5">
              View Market <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}
