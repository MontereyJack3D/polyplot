'use client';

interface CategoryTableProps {
  rows: Array<{
    category: string;
    edge: number;
    winRate: number;
    roi: number;
    trades: number;
    pnl?: number;
  }>;
  onSelect: (category: string) => void;
  hidePnl?: boolean;
}

export function CategoryTable({ rows, onSelect, hidePnl = false }: CategoryTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 overflow-x-auto">
      <h3 className="text-sm font-medium mb-3">Category Performance</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground text-xs border-b border-border">
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Edge</th>
            <th className="py-2 pr-3">Win Rate</th>
            <th className="py-2 pr-3">ROI</th>
            <th className="py-2 pr-3">Trades</th>
            {!hidePnl && <th className="py-2">PnL</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.category}
              className="border-b border-border/60 hover:bg-secondary/40 cursor-pointer"
              onClick={() => onSelect(row.category)}
            >
              <td className="py-2.5 pr-3">{row.category}</td>
              <td className="py-2.5 pr-3 font-mono">{row.edge.toFixed(1)}</td>
              <td className="py-2.5 pr-3 font-mono">{(row.winRate * 100).toFixed(1)}%</td>
              <td className="py-2.5 pr-3 font-mono">{(row.roi * 100).toFixed(1)}%</td>
              <td className="py-2.5 pr-3 font-mono">{row.trades}</td>
              {!hidePnl && (
                <td className={['py-2.5 font-mono', (row.pnl ?? 0) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                  {(row.pnl ?? 0) >= 0 ? '+' : '-'}${Math.abs(row.pnl ?? 0).toFixed(2)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
