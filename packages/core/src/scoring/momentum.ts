export interface RatingPoint {
  ts: string;
  rAfter: number;
  delta: number;
}

export function computeMomentum(recentEvents: RatingPoint[], windowSize: number = 10): number {
  if (recentEvents.length < 2) return 50;

  const events = recentEvents.slice(-windowSize);

  const n = events.length;
  const xs = events.map((_, i) => i);
  const ys = events.map((event) => event.rAfter);

  const sumX = xs.reduce((sum, x) => sum + x, 0);
  const sumY = ys.reduce((sum, y) => sum + y, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;

  const normalizedSlope = Math.max(0, Math.min(100, 50 + slope * 10));

  return Math.round(normalizedSlope * 10) / 10;
}

export function computeStreaks(
  resolvedDecisions: Array<{ actualS: number | null; ts: string }>
): { current: number; best: number; currentType: 'win' | 'loss' } {
  const sorted = [...resolvedDecisions]
    .filter((decision) => decision.actualS !== null)
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  let current = 0;
  let best = 0;
  let currentType: 'win' | 'loss' = 'win';
  let tempStreak = 0;
  let tempType: 'win' | 'loss' = 'win';

  for (const decision of sorted) {
    const won = decision.actualS! > 0.5;
    const thisType = won ? 'win' : 'loss';

    if (thisType === tempType) {
      tempStreak++;
    } else {
      tempStreak = 1;
      tempType = thisType;
    }

    if (tempType === 'win' && tempStreak > best) {
      best = tempStreak;
    }

    current = tempStreak;
    currentType = tempType;
  }

  return { current, best, currentType };
}
