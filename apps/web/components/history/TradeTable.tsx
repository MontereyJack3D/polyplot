'use client';

import { format } from 'date-fns';

interface TradeRow {
  tradeId: string;
  date: string;
  market: string;
  side: 'YES' | 'NO';
  direction: 'buy' | 'sell';
  price: number;
  quantity: number;
  fee: number;
  pnl: number;
  outcome: 'win' | 'loss' | 'pending';
}

interface TradeTableProps {
  rows: TradeRow[];
  onSelect: (tradeId: string) => void;
}

export function TradeTable({ rows, onSelect }: TradeTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground text-xs border-b border-border">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Market</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">Direction</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Fee</th>
            <th className="px-4 py-3">PnL</th>
            <th className="px-4 py-3">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.tradeId} onClick={() => onSelect(row.tradeId)} className="cursor-pointer border-b border-border/60 hover:bg-secondary/40">
              <td className="px-4 py-3">{format(new Date(row.date), 'PP p')}</td>
              <td className="px-4 py-3 max-w-[360px] truncate">{row.market}</td>
              <td className="px-4 py-3"><span className={['px-2 py-0.5 rounded-full text-xs', row.side === 'YES' ? 'bg-primary/15 text-primary' : 'bg-indigo-500/15 text-indigo-400'].join(' ')}>{row.side}</span></td>
              <td className="px-4 py-3 uppercase">{row.direction}</td>
              <td className="px-4 py-3 font-mono">{row.price.toFixed(3)}</td>
              <td className="px-4 py-3 font-mono">{row.quantity.toFixed(2)}</td>
              <td className="px-4 py-3 font-mono">${row.fee.toFixed(2)}</td>
              <td className={['px-4 py-3 font-mono', row.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>{row.pnl >= 0 ? '+' : '-'}${Math.abs(row.pnl).toFixed(2)}</td>
              <td className="px-4 py-3 capitalize">{row.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
