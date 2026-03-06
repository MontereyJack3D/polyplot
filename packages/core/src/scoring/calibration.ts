import { PROBABILITY_BANDS, type ProbabilityBand } from './constants';

export interface CalibrationBand {
  band: ProbabilityBand;
  tradeCount: number;
  winRate: number | null;
  roi: number | null;
  edgeContribution: number;
  logLossAvg: number | null;
  calibrationError: number | null;
}

export interface DecisionForCalibration {
  pIn: number;
  side: 'YES' | 'NO';
  y: number | null;
  isResolved: boolean;
  ratingDeltaFinal: number | null;
  logLoss: number | null;
  realizedPnl?: number;
  costBasis?: number;
}

export function classifyProbabilityBand(prob: number): ProbabilityBand {
  if (prob < 0.2) return '0-20';
  if (prob < 0.4) return '20-40';
  if (prob < 0.6) return '40-60';
  if (prob < 0.8) return '60-80';
  return '80-100';
}

export function computeCalibration(decisions: DecisionForCalibration[]): CalibrationBand[] {
  return PROBABILITY_BANDS.map((band) => {
    const [low, high] = band.split('-').map(Number).map((n) => n / 100);

    const bandDecisions = decisions.filter((decision) => {
      const p = decision.side === 'YES' ? decision.pIn : 1 - decision.pIn;
      return p >= low && p < (high === 1 ? 1.01 : high);
    });

    const resolved = bandDecisions.filter((decision) => decision.isResolved && decision.y !== null);
    const tradeCount = bandDecisions.length;

    if (tradeCount === 0) {
      return {
        band,
        tradeCount: 0,
        winRate: null,
        roi: null,
        edgeContribution: 0,
        logLossAvg: null,
        calibrationError: null,
      };
    }

    const wins = resolved.filter((decision) => {
      const actual = decision.side === 'YES' ? decision.y! : 1 - decision.y!;
      return actual > 0.5;
    });
    const winRate = resolved.length > 0 ? wins.length / resolved.length : null;

    const edgeContribution = bandDecisions.reduce((sum, decision) => sum + (decision.ratingDeltaFinal || 0), 0);

    const logLossValues = resolved.filter((decision) => decision.logLoss !== null).map((decision) => decision.logLoss!);
    const logLossAvg =
      logLossValues.length > 0
        ? logLossValues.reduce((sum, value) => sum + value, 0) / logLossValues.length
        : null;

    let calibrationError: number | null = null;
    if (resolved.length > 0) {
      const avgPredicted =
        resolved.reduce((sum, decision) => sum + (decision.side === 'YES' ? decision.pIn : 1 - decision.pIn), 0) /
        resolved.length;
      const realizedFrequency = wins.length / resolved.length;
      calibrationError = Math.abs(avgPredicted - realizedFrequency);
    }

    const totalCost = bandDecisions.reduce((sum, decision) => sum + (decision.costBasis || 0), 0);
    const totalPnl = bandDecisions.reduce((sum, decision) => sum + (decision.realizedPnl || 0), 0);
    const roi = totalCost > 0 ? totalPnl / totalCost : null;

    return {
      band,
      tradeCount,
      winRate,
      roi,
      edgeContribution,
      logLossAvg,
      calibrationError,
    };
  });
}
