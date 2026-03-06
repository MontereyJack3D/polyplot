export interface OpportunityInput {
  marketId: string;
  question: string;
  category: string;
  currentProb: number;
  volume24h: number;
  liquidityScore: number;
  stabilityScore: number;
  endTime: string | null;
}

export interface UserSkillProfile {
  edgeScore: number;
  categoryEdge: Record<string, number>;
  bandPerformance: Record<string, number>;
  venuePreference: string;
}

export interface OpportunityResult {
  marketId: string;
  score: number;
  components: {
    skillAlignment: number;
    mispricingSignal: number;
    momentumBonus: number;
    riskPenalty: number;
  };
  explanation: string;
  recommendedAction: 'strong_buy' | 'consider' | 'watch' | 'avoid';
}

/**
 * Score a market opportunity for a user.
 * Pure function — no DB calls.
 */
export function scoreOpportunity(market: OpportunityInput, profile: UserSkillProfile): OpportunityResult {
  const components = {
    skillAlignment: 0,
    mispricingSignal: 0,
    momentumBonus: 0,
    riskPenalty: 0,
  };

  const normalizedCategory = market.category?.trim() || 'Other';

  // Skill Alignment (0-40)
  const categoryEdge = profile.categoryEdge[normalizedCategory] ?? profile.categoryEdge[normalizedCategory.toLowerCase()] ?? 0;
  const categoryScore = Math.min(categoryEdge / 3, 20);

  const band = classifyBand(market.currentProb);
  const bandWinRate = profile.bandPerformance[band] ?? 0.5;
  const bandScore = Math.max(0, (bandWinRate - 0.5) * 40);

  components.skillAlignment = Math.min(categoryScore + bandScore, 40);

  // Mispricing Signal (0-30)
  const probDistance = Math.abs(market.currentProb - 0.5);
  const uncertaintyBonus = (0.5 - probDistance) * 40;
  const volumeBonus = Math.min(Math.log10(Math.max(market.volume24h, 1)) * 3, 10);
  components.mispricingSignal = Math.min(uncertaintyBonus + volumeBonus, 30);

  // Momentum Bonus (0-15)
  const edgeBonus = Math.max(0, ((profile.edgeScore - 50) / 50) * 15);
  components.momentumBonus = Math.min(edgeBonus, 15);

  // Risk Penalty (0 to -15)
  if (market.liquidityScore < 0.3) components.riskPenalty -= 5;
  if (market.stabilityScore < 0.3) components.riskPenalty -= 5;

  if (market.endTime) {
    const hoursToEnd = (new Date(market.endTime).getTime() - Date.now()) / 3600000;
    if (hoursToEnd < 24) components.riskPenalty -= 5;
  }

  components.riskPenalty = Math.max(components.riskPenalty, -15);

  const score = Math.max(
    0,
    Math.min(
      100,
      components.skillAlignment +
        components.mispricingSignal +
        components.momentumBonus +
        components.riskPenalty,
    ),
  );

  const explanationParts: string[] = [];
  if (components.skillAlignment >= 20) {
    explanationParts.push(`Strong alignment with your ${normalizedCategory} edge`);
  } else if (components.skillAlignment >= 10) {
    explanationParts.push('Moderate alignment with your skill profile');
  }
  if (components.mispricingSignal >= 15) {
    explanationParts.push('High-uncertainty market with room for edge');
  }
  if (components.riskPenalty < -5) {
    explanationParts.push('Watch: liquidity or stability concerns');
  }

  const explanation = explanationParts.join('. ') || 'General market opportunity';

  const recommendedAction: OpportunityResult['recommendedAction'] =
    score >= 70 ? 'strong_buy' : score >= 50 ? 'consider' : score >= 30 ? 'watch' : 'avoid';

  return {
    marketId: market.marketId,
    score: Math.round(score * 10) / 10,
    components,
    explanation,
    recommendedAction,
  };
}

function classifyBand(prob: number): string {
  if (prob < 0.2) return '0-20';
  if (prob < 0.4) return '20-40';
  if (prob < 0.6) return '40-60';
  if (prob < 0.8) return '60-80';
  return '80-100';
}
