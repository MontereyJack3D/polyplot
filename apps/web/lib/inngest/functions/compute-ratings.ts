import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

const K = 20;
const W_MAX = 2;
const TAU = 30;
const LAMBDA = 0.25;
const R0 = 1500;
const D = 250;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

type DecisionRow = {
  decision_id: string;
  side: 'YES' | 'NO';
  p_in: number;
  y: number | null;
  is_resolved: boolean;
  expected_E: number | null;
  actual_S: number | null;
  capture: number | null;
  weight_size: number | null;
};

type RatingStateRow = {
  rating_r: number;
  edge_score: number;
  resolved_decision_count: number;
};

export const computeRatings = inngest.createFunction(
  { id: 'compute-ratings', name: 'Compute Edge Score Rating Update' },
  { event: 'decision/created' },
  async ({ event, step }) => {
    const { decisionId, userId } = event.data;
    const supabase = createAdminClient();

    await step.run('update-rating', async () => {
      const { data: decision } = await supabase
        .from('decisions')
        .select('decision_id, side, p_in, y, is_resolved, expected_E, actual_S, capture, weight_size')
        .eq('decision_id', decisionId)
        .single<DecisionRow>();

      if (!decision || !decision.is_resolved || decision.y === null) {
        return;
      }

      const { data: state } = await supabase
        .from('user_rating_state')
        .select('rating_r, edge_score, resolved_decision_count')
        .eq('user_id', userId)
        .single<RatingStateRow>();

      if (!state) {
        return;
      }

      const E = decision.expected_E ?? (decision.side === 'YES' ? decision.p_in : 1 - decision.p_in);
      const S = decision.actual_S ?? (decision.side === 'YES' ? decision.y : 1 - decision.y);
      const capture = decision.capture ?? 0;

      const wSize = Math.min(decision.weight_size ?? 1, W_MAX);
      const n = state.resolved_decision_count;
      const wReliability = n / (n + TAU);
      const wFinal = wSize * wReliability;

      const delta = K * wFinal * ((S - E) + LAMBDA * capture);
      const rNew = state.rating_r + delta;
      const newEdgeScore = 100 * sigmoid((rNew - R0) / D);

      const logLoss = -(S * Math.log(Math.max(E, 0.001)) + (1 - S) * Math.log(Math.max(1 - E, 0.001)));

      await supabase
        .from('decisions')
        .update({
          expected_E: E,
          actual_S: S,
          log_loss: logLoss,
          weight_reliability: wReliability,
          weight_final: wFinal,
          rating_delta_final: delta,
        })
        .eq('decision_id', decisionId);

      await supabase.from('rating_events').insert({
        user_id: userId,
        decision_id: decisionId,
        ts: new Date().toISOString(),
        update_type: 'resolution',
        r_before: state.rating_r,
        r_after: rNew,
        delta,
        components_json: {
          E,
          S,
          capture,
          wSize,
          wReliability,
          wFinal,
          K,
          lambda: LAMBDA,
        },
      });

      await supabase
        .from('user_rating_state')
        .update({
          rating_r: rNew,
          edge_score: newEdgeScore,
          resolved_decision_count: n + 1,
          reliability_factor: (n + 1) / (n + 1 + TAU),
          last_updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    });

    return { userId, decisionId };
  }
);
