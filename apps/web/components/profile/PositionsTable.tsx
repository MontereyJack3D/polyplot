'use client';

interface PositionItem {
  positionId: string;
  marketQuestion: string;
  side: string;
  status: string;
  entryProb: number | null;
  exitProb: number | null;
  currentProb: number | null;
  netQuantity: number;
  costBasis: number | null;
  currentValue: number | null;
  realizedPnl: number;
  unrealizedPnl: number;
  roiTotal: number | null;
}

interface PositionsTableProps {
  items: PositionItem[];
  mode: 'open' | 'closed';
  hideSensitive?: boolean;
}

export function PositionsTable({ items, mode, hideSensitive = false }: PositionsTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 overflow-x-auto">
      <h3 className="text-sm font-medium mb-3">{mode === 'open' ? 'Active Positions' : 'Closed Positions'}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground text-xs border-b border-border">
            <th className="py-2 pr-3">Market</th>
            <th className="py-2 pr-3">Side</th>
            <th className="py-2 pr-3">Entry</th>
            <th className="py-2 pr-3">{mode === 'open' ? 'Current' : 'Exit'}</th>
            {!hideSensitive && <th className="py-2 pr-3">PnL</th>}
            {!hideSensitive && <th className="py-2">ROI</th>}
            {mode === 'closed' && <th className="py-2">Result</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const pnl = mode === 'open' ? item.unrealizedPnl : item.realizedPnl;
            const prob = mode === 'open' ? item.currentProb : item.exitProb;

            return (
              <tr key={item.positionId} className="border-b border-border/60">
                <td className="py-2.5 pr-3">{item.marketQuestion}</td>
                <td className="py-2.5 pr-3">{item.side}</td>
                <td className="py-2.5 pr-3 font-mono">{item.entryProb !== null ? `${(item.entryProb * 100).toFixed(1)}%` : '—'}</td>
                <td className="py-2.5 pr-3 font-mono">{prob !== null ? `${(prob * 100).toFixed(1)}%` : '—'}</td>
                {!hideSensitive && (
                  <td className={['py-2.5 pr-3 font-mono', pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                    {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                  </td>
                )}
                {!hideSensitive && <td className="py-2.5 font-mono">{item.roiTotal !== null ? `${(item.roiTotal * 100).toFixed(1)}%` : '—'}</td>}
                {mode === 'closed' && (
                  <td className={['py-2.5 text-xs font-medium', item.realizedPnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                    {item.realizedPnl >= 0 ? 'Win' : 'Loss'}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
