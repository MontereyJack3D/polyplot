'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface EdgeMapProps {
  categories: Array<{ category: string; edge: number; winRate: number; trades?: number; roi?: number }>;
}

export function EdgeMap({ categories }: EdgeMapProps) {
  const radarData = categories.slice(0, 6).map((row) => ({
    axis: row.category,
    edge: Math.max(0, Math.min(100, row.edge)),
    winRate: Math.max(0, Math.min(100, row.winRate * 100)),
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">Edge Fingerprint</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="axis" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Radar dataKey="edge" stroke="#00d4aa" fill="#00d4aa" fillOpacity={0.2} />
              <Radar dataKey="winRate" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">Category Ranking & Probability Edge</h3>
        <div className="mb-5 flex justify-center">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              {[
                { offset: 0, color: '#00d4aa' },
                { offset: 72, color: '#14b8a6' },
                { offset: 144, color: '#22c55e' },
                { offset: 216, color: '#f59e0b' },
                { offset: 288, color: '#ef4444' },
              ].map((segment, index) => (
                <circle
                  key={segment.offset}
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="12"
                  strokeDasharray={`${(2 * Math.PI * 46) / 5 - 4} ${2 * Math.PI * 46}`}
                  strokeDashoffset={-segment.offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${60} ${60})`}
                  opacity={0.9 - index * 0.1}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Bands</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {categories.map((row) => {
            const width = Math.max(5, Math.min(100, row.edge));
            return (
              <div key={row.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>{row.category}</span>
                  <span className="font-mono">{row.edge.toFixed(1)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-[#00d4aa]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
