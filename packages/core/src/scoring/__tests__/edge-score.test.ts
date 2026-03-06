import { describe, expect, it } from 'vitest';

import {
  computeActual,
  computeCapture,
  computeExpected,
  computeLogLoss,
  computeRatingUpdate,
  computeWeightReliability,
  computeWeightSize,
  ratingToEdgeScore,
  sigmoid,
} from '../edge-score';

describe('sigmoid', () => {
  it('returns 0.5 at x=0', () => {
    expect(sigmoid(0)).toBe(0.5);
  });

  it('approaches 1 for large positive x', () => {
    expect(sigmoid(10)).toBeGreaterThan(0.999);
  });

  it('approaches 0 for large negative x', () => {
    expect(sigmoid(-10)).toBeLessThan(0.001);
  });
});

describe('ratingToEdgeScore', () => {
  it('returns 50 at R=1500 (default R0)', () => {
    expect(ratingToEdgeScore(1500)).toBeCloseTo(50, 1);
  });

  it('returns ~73.1 at R=1750', () => {
    expect(ratingToEdgeScore(1750)).toBeCloseTo(73.1, 0);
  });

  it('returns ~26.9 at R=1250', () => {
    expect(ratingToEdgeScore(1250)).toBeCloseTo(26.9, 0);
  });

  it('is bounded between 0 and 100', () => {
    expect(ratingToEdgeScore(0)).toBeGreaterThan(0);
    expect(ratingToEdgeScore(3000)).toBeLessThan(100);
  });
});

describe('computeExpected', () => {
  it('returns pIn for YES side', () => {
    expect(computeExpected('YES', 0.65)).toBe(0.65);
  });

  it('returns 1-pIn for NO side', () => {
    expect(computeExpected('NO', 0.65)).toBeCloseTo(0.35);
  });
});

describe('computeActual', () => {
  it('returns y for YES side', () => {
    expect(computeActual('YES', 1)).toBe(1);
    expect(computeActual('YES', 0)).toBe(0);
  });

  it('returns 1-y for NO side', () => {
    expect(computeActual('NO', 1)).toBe(0);
    expect(computeActual('NO', 0)).toBe(1);
  });
});

describe('computeCapture', () => {
  it('returns positive when YES price goes up', () => {
    expect(computeCapture('YES', 0.4, 0.6)).toBeCloseTo(0.2);
  });

  it('returns positive when NO price goes down (market prob drops)', () => {
    expect(computeCapture('NO', 0.6, 0.4)).toBeCloseTo(0.2);
  });

  it('returns 0 when pOut is null', () => {
    expect(computeCapture('YES', 0.4, null)).toBe(0);
  });
});

describe('computeWeightSize', () => {
  it('returns 1.0 for median quantity', () => {
    expect(computeWeightSize(100)).toBeCloseTo(1.0);
  });

  it('caps at w_max', () => {
    expect(computeWeightSize(100000)).toBe(2.0);
  });

  it('returns sqrt scaling', () => {
    expect(computeWeightSize(400)).toBeCloseTo(2.0);
  });
});

describe('computeWeightReliability', () => {
  it('returns 0.5 when n=tau', () => {
    expect(computeWeightReliability(30)).toBeCloseTo(0.5);
  });

  it('returns close to 0 for new users', () => {
    expect(computeWeightReliability(1)).toBeCloseTo(1 / 31);
  });

  it('approaches 1 for experienced users', () => {
    expect(computeWeightReliability(1000)).toBeGreaterThan(0.97);
  });
});

describe('computeLogLoss', () => {
  it('returns low loss for correct confident prediction', () => {
    const loss = computeLogLoss(0.9, 1);
    expect(loss).toBeLessThan(0.15);
  });

  it('returns high loss for wrong confident prediction', () => {
    const loss = computeLogLoss(0.9, 0);
    expect(loss).toBeGreaterThan(2);
  });

  it('handles edge probabilities without NaN', () => {
    expect(computeLogLoss(0.001, 1)).toBeDefined();
    expect(computeLogLoss(0.999, 0)).toBeDefined();
    expect(Number.isFinite(computeLogLoss(0, 1))).toBe(true);
    expect(Number.isFinite(computeLogLoss(1, 0))).toBe(true);
  });
});

describe('computeRatingUpdate', () => {
  it('increases rating for a correct underpriced YES bet', () => {
    const result = computeRatingUpdate({
      side: 'YES',
      pIn: 0.3,
      pOut: null,
      y: 1,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 30,
    });

    expect(result.delta).toBeGreaterThan(0);
    expect(result.rAfter).toBeGreaterThan(1500);
    expect(result.edgeScoreAfter).toBeGreaterThan(50);
    expect(result.expectedE).toBe(0.3);
    expect(result.actualS).toBe(1);
  });

  it('decreases rating for incorrect overpriced YES bet', () => {
    const result = computeRatingUpdate({
      side: 'YES',
      pIn: 0.8,
      pOut: null,
      y: 0,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 30,
    });

    expect(result.delta).toBeLessThan(0);
    expect(result.rAfter).toBeLessThan(1500);
  });

  it('rewards capture bonus for well-timed exit', () => {
    const withCapture = computeRatingUpdate({
      side: 'YES',
      pIn: 0.3,
      pOut: 0.6,
      y: 1,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 30,
    });

    const withoutCapture = computeRatingUpdate({
      side: 'YES',
      pIn: 0.3,
      pOut: null,
      y: 1,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 30,
    });

    expect(withCapture.delta).toBeGreaterThan(withoutCapture.delta);
  });

  it('applies reliability shrinkage to new users', () => {
    const newUser = computeRatingUpdate({
      side: 'YES',
      pIn: 0.3,
      pOut: null,
      y: 1,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 1,
    });

    const expUser = computeRatingUpdate({
      side: 'YES',
      pIn: 0.3,
      pOut: null,
      y: 1,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 100,
    });

    expect(Math.abs(newUser.delta)).toBeLessThan(Math.abs(expUser.delta));
  });

  it('handles NO side correctly', () => {
    const result = computeRatingUpdate({
      side: 'NO',
      pIn: 0.7,
      pOut: null,
      y: 0,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 30,
    });

    expect(result.expectedE).toBeCloseTo(0.3);
    expect(result.actualS).toBe(1);
    expect(result.delta).toBeGreaterThan(0);
  });

  it('sanity: underdog call at 30% gives ~7-10 rating delta for experienced user', () => {
    const result = computeRatingUpdate({
      side: 'YES',
      pIn: 0.3,
      pOut: null,
      y: 1,
      quantity: 100,
      currentRatingR: 1500,
      resolvedDecisionCount: 50,
    });

    expect(result.delta).toBeGreaterThanOrEqual(7);
    expect(result.delta).toBeLessThanOrEqual(10);
  });
});
