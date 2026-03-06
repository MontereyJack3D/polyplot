'use client';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'flat';
}

export function StatCard({ title, value, subValue, trend = 'flat' }: StatCardProps) {
  const trendClass =
    trend === 'up' ? 'text-[#22c55e]' : trend === 'down' ? 'text-[#ef4444]' : 'text-muted-foreground';

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-mono font-semibold text-foreground">{value}</p>
      {subValue ? <p className={['mt-2 text-xs', trendClass].join(' ')}>{subValue}</p> : null}
    </div>
  );
}
