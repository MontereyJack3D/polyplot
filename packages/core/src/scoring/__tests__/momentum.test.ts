import { describe, expect, it } from 'vitest';

import { computeMomentum, computeStreaks } from '../momentum';

describe('computeMomentum', () => {
  it('returns 50 with fewer than 2 events', () => {
    expect(computeMomentum([])).toBe(50);
    expect(computeMomentum([{ ts: '2026-01-01T00:00:00.000Z', rAfter: 1500, delta: 0 }])).toBe(50);
  });

  it('returns ~50 for flat trajectory', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      ts: new Date(2026, 0, i + 1).toISOString(),
      rAfter: 1500,
      delta: 0,
    }));
    expect(computeMomentum(events)).toBe(50);
  });

  it('returns >50 for rising trajectory', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      ts: new Date(2026, 0, i + 1).toISOString(),
      rAfter: 1500 + i * 2,
      delta: 2,
    }));
    expect(computeMomentum(events)).toBeGreaterThan(50);
  });

  it('returns <50 for falling trajectory', () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      ts: new Date(2026, 0, i + 1).toISOString(),
      rAfter: 1500 - i * 2,
      delta: -2,
    }));
    expect(computeMomentum(events)).toBeLessThan(50);
  });
});

describe('computeStreaks', () => {
  it('handles empty input', () => {
    expect(computeStreaks([])).toEqual({ current: 0, best: 0, currentType: 'win' });
  });

  it('handles single win', () => {
    const result = computeStreaks([{ actualS: 1, ts: '2026-01-01T00:00:00.000Z' }]);
    expect(result).toEqual({ current: 1, best: 1, currentType: 'win' });
  });

  it('tracks consecutive wins', () => {
    const result = computeStreaks([
      { actualS: 1, ts: '2026-01-01T00:00:00.000Z' },
      { actualS: 1, ts: '2026-01-02T00:00:00.000Z' },
      { actualS: 1, ts: '2026-01-03T00:00:00.000Z' },
    ]);
    expect(result.best).toBe(3);
    expect(result.current).toBe(3);
    expect(result.currentType).toBe('win');
  });

  it('tracks mixed results and current streak type', () => {
    const result = computeStreaks([
      { actualS: 1, ts: '2026-01-01T00:00:00.000Z' },
      { actualS: 0, ts: '2026-01-02T00:00:00.000Z' },
      { actualS: 0, ts: '2026-01-03T00:00:00.000Z' },
      { actualS: 1, ts: '2026-01-04T00:00:00.000Z' },
      { actualS: 1, ts: '2026-01-05T00:00:00.000Z' },
    ]);

    expect(result.best).toBe(2);
    expect(result.current).toBe(2);
    expect(result.currentType).toBe('win');
  });
});
