import { SCORING_DEFAULTS, type ScoringParams } from './constants';

export interface RatingInput {
  side: 'YES' | 'NO';
  pIn: number;
  pOut: number | null;
  y: number;
  quantity: number;
  currentRatingR: number;
  resolvedDecisionCount: number;
}

export interface RatingUpdate {
  rBefore: number;
  rAfter: number;
  delta: number;
  edgeScoreBefore: number;
  edgeScoreAfter: number;
  expectedE: number;
  actualS: number;
  capture: number;
  weightSize: number;
  weightReliability: number;
  weightFinal: number;
  logLoss: number;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function ratingToEdgeScore(r: number, params: ScoringParams = SCORING_DEFAULTS): number {
  return 100 * sigmoid((r - params.R0) / params.D);
}

export function computeExpected(side: 'YES' | 'NO', pIn: number): number {
  return side === 'YES' ? pIn : 1 - pIn;
}

export function computeActual(side: 'YES' | 'NO', y: number): number {
  return side === 'YES' ? y : 1 - y;
}

export function computeCapture(side: 'YES' | 'NO', pIn: number, pOut: number | null): number {
  if (pOut === null) return 0;
  return side === 'YES' ? pOut - pIn : pIn - pOut;
}

export function computeWeightSize(quantity: number, params: ScoringParams = SCORING_DEFAULTS): number {
  return Math.min(Math.sqrt(quantity / params.MEDIAN_QUANTITY), params.W_MAX);
}

export function computeWeightReliability(
  resolvedDecisionCount: number,
  params: ScoringParams = SCORING_DEFAULTS
): number {
  return resolvedDecisionCount / (resolvedDecisionCount + params.TAU);
}

export function computeLogLoss(expected: number, actual: number): number {
  const clampedE = Math.max(Math.min(expected, 0.999), 0.001);
  return -(actual * Math.log(clampedE) + (1 - actual) * Math.log(1 - clampedE));
}

export function computeRatingUpdate(
  input: RatingInput,
  params: ScoringParams = SCORING_DEFAULTS
): RatingUpdate {
  const E = computeExpected(input.side, input.pIn);
  const S = computeActual(input.side, input.y);
  const capture = computeCapture(input.side, input.pIn, input.pOut);

  const wSize = computeWeightSize(input.quantity, params);
  const wReliability = computeWeightReliability(input.resolvedDecisionCount, params);
  const wFinal = wSize * wReliability;

  const delta = params.K * wFinal * ((S - E) + params.LAMBDA * capture);
  const rAfter = input.currentRatingR + delta;

  const logLoss = computeLogLoss(E, S);

  return {
    rBefore: input.currentRatingR,
    rAfter,
    delta,
    edgeScoreBefore: ratingToEdgeScore(input.currentRatingR, params),
    edgeScoreAfter: ratingToEdgeScore(rAfter, params),
    expectedE: E,
    actualS: S,
    capture,
    weightSize: wSize,
    weightReliability: wReliability,
    weightFinal: wFinal,
    logLoss,
  };
}
