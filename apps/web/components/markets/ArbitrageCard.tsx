'use client';

interface ArbitrageCardProps {
  item: {
    id: string;
    marketPair: string;
    polymarketProb: number | null;
    kalshiProb: number | null;
    spread: number | null;
    expectedProfitBps: number | null;
    executionConfidence: number | null;
  };
}

export function ArbitrageCard({ item }: ArbitrageCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-sm line-clamp-2">{item.marketPair}</p>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Polymarket</p>
          <p className="font-mono mt-1">{item.polymarketProb !== null ? `${(item.polymarketProb * 100).toFixed(1)}%` : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Kalshi</p>
          <p className="font-mono mt-1">{item.kalshiProb !== null ? `${(item.kalshiProb * 100).toFixed(1)}%` : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Spread</p>
          <p className="font-mono mt-1">{item.spread !== null ? `${(item.spread * 100).toFixed(2)}%` : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expected Profit</p>
          <p className="font-mono mt-1">{item.expectedProfitBps !== null ? `${item.expectedProfitBps.toFixed(0)} bps` : '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Confidence</p>
          <p className="font-mono mt-1">{item.executionConfidence !== null ? `${(item.executionConfidence * 100).toFixed(0)}%` : '—'}</p>
        </div>
      </div>
      <button className="mt-3 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground cursor-not-allowed">
        Execute (coming soon)
      </button>
    </div>
  );
}
