import { describe, expect, it } from 'vitest';

import { classifyProbabilityBand, computeCalibration } from '../calibration';

describe('classifyProbabilityBand', () => {
  it('handles boundaries', () => {
    expect(classifyProbabilityBand(0)).toBe('0-20');
    expect(classifyProbabilityBand(0.2)).toBe('20-40');
    expect(classifyProbabilityBand(0.4)).toBe('40-60');
    expect(classifyProbabilityBand(0.6)).toBe('60-80');
    expect(classifyProbabilityBand(0.8)).toBe('80-100');
    expect(classifyProbabilityBand(1.0)).toBe('80-100');
  });
});

describe('computeCalibration', () => {
  it('returns all bands for empty input', () => {
    const result = computeCalibration([]);
    expect(result).toHaveLength(5);
    expect(result.every((band) => band.tradeCount === 0)).toBe(true);
  });

  it('handles single resolved decision', () => {
    const result = computeCalibration([
      {
        pIn: 0.3,
        side: 'YES',
        y: 1,
        isResolved: true,
        ratingDeltaFinal: 4,
        logLoss: 0.35,
        costBasis: 100,
        realizedPnl: 20,
      },
    ]);

    const band = result.find((entry) => entry.band === '20-40');
    expect(band?.tradeCount).toBe(1);
    expect(band?.winRate).toBe(1);
    expect(band?.roi).toBeCloseTo(0.2);
    expect(band?.edgeContribution).toBe(4);
  });

  it('computes multiple bands and calibration error', () => {
    const result = computeCalibration([
      {
        pIn: 0.1,
        side: 'YES',
        y: 0,
        isResolved: true,
        ratingDeltaFinal: -1,
        logLoss: 0.12,
        costBasis: 10,
        realizedPnl: -10,
      },
      {
        pIn: 0.9,
        side: 'NO',
        y: 0,
        isResolved: true,
        ratingDeltaFinal: 2,
        logLoss: 0.15,
        costBasis: 20,
        realizedPnl: 5,
      },
      {
        pIn: 0.55,
        side: 'YES',
        y: null,
        isResolved: false,
        ratingDeltaFinal: 0,
        logLoss: null,
        costBasis: 30,
        realizedPnl: 0,
      },
    ]);

    const lowBand = result.find((entry) => entry.band === '0-20');
    expect(lowBand?.tradeCount).toBe(2);
    expect(lowBand?.calibrationError).not.toBeNull();

    const midBand = result.find((entry) => entry.band === '40-60');
    expect(midBand?.tradeCount).toBe(1);
    expect(midBand?.winRate).toBeNull();
  });
});
