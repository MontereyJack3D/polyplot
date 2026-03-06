'use client';

interface ProbabilityHeatmapProps {
  bands: Array<{
    band: string;
    edgeContribution: number;
    winRate: number;
    trades: number;
    calibrationError?: number;
  }>;
  onSelectBand?: (band: string) => void;
}

function bandBg(value: number): string {
  if (value >= 0) return `rgba(0,212,170,${Math.min(0.55, 0.12 + Math.abs(value) / 80)})`;
  return `rgba(239,68,68,${Math.min(0.55, 0.12 + Math.abs(value) / 80)})`;
}

export function ProbabilityHeatmap({ bands, onSelectBand }: ProbabilityHeatmapProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium mb-3">Probability Skill Heatmap</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {bands.map((band) => (
          <button
            key={band.band}
            type="button"
            onClick={() => onSelectBand?.(band.band)}
            className="rounded-lg border border-border p-3 text-left hover:border-primary/50 transition-colors"
            style={{ background: bandBg(band.edgeContribution) }}
          >
            <p className="text-xs text-muted-foreground">{band.band}%</p>
            <p className="mt-1 text-sm font-mono">{(band.winRate * 100).toFixed(0)}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">{band.trades} trades</p>
            <p className="text-[11px] text-muted-foreground">Cal err {(band.calibrationError ?? 0).toFixed(2)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
