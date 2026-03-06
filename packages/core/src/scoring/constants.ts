export const SCORING_DEFAULTS = {
  K: 20,
  W_MAX: 2.0,
  TAU: 30,
  LAMBDA: 0.25,
  R0: 1500,
  D: 250,
  INITIAL_EDGE_SCORE: 50,
  MEDIAN_QUANTITY: 100,
} as const;

export type ScoringParams = typeof SCORING_DEFAULTS;

export const PROBABILITY_BANDS = ['0-20', '20-40', '40-60', '60-80', '80-100'] as const;
export type ProbabilityBand = (typeof PROBABILITY_BANDS)[number];
