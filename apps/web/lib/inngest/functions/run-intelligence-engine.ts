import { scoreOpportunity, type OpportunityInput, type UserSkillProfile } from '@polyplot/core';

import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

interface OpenMarketRow {
  market_id: string;
  question: string;
  category_raw: string | null;
  end_time: string | null;
}

interface MarketPriceRow {
  market_id: string;
  ts: string;
  mid_prob: number | null;
  volume_24h: number | null;
  liquidity_score: number | null;
  stability_score: number | null;
}

export const runIntelligenceEngine = inngest.createFunction(
  { id: 'run-intelligence-engine', name: 'Run Intelligence Engine' },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const supabase = createAdminClient();

    const users = await step.run('get-users', async () => {
      const { data } = await supabase.from('venue_accounts').select('user_id').eq('connection_status', 'connected');
      return [...new Set((data ?? []).map((row) => row.user_id))];
    });

    const markets = await step.run('get-markets', async () => {
      const { data: openMarkets } = await supabase
        .from('markets')
        .select('market_id,question,category_raw,end_time')
        .eq('status', 'open')
        .limit(200);

      const marketRows = (openMarkets ?? []) as OpenMarketRow[];
      if (marketRows.length === 0) return [] as OpportunityInput[];

      const marketIds = marketRows.map((market) => market.market_id);
      const { data: priceRows } = await supabase
        .from('market_prices')
        .select('market_id,ts,mid_prob,volume_24h,liquidity_score,stability_score')
        .in('market_id', marketIds)
        .order('ts', { ascending: false });

      const latestByMarket = new Map<string, MarketPriceRow>();
      for (const row of (priceRows ?? []) as MarketPriceRow[]) {
        if (!latestByMarket.has(row.market_id)) latestByMarket.set(row.market_id, row);
      }

      return marketRows.map((market) => {
        const latest = latestByMarket.get(market.market_id);
        return {
          marketId: market.market_id,
          question: market.question,
          category: market.category_raw || 'Other',
          currentProb: latest?.mid_prob ?? 0.5,
          volume24h: latest?.volume_24h ?? 0,
          liquidityScore: latest?.liquidity_score ?? 0.5,
          stabilityScore: latest?.stability_score ?? 0.5,
          endTime: market.end_time,
        } satisfies OpportunityInput;
      });
    });

    const runId = await step.run('create-run', async () => {
      const { data } = await supabase
        .from('engine_runs')
        .insert({
          engine_name: 'intelligence_v0',
          run_type: 'cron',
          ts_start: new Date().toISOString(),
          status: 'running',
          config_json: { marketsCount: markets.length, usersCount: users.length },
          version: 'v0',
        })
        .select('run_id')
        .single();

      return data?.run_id ?? null;
    });

    if (!runId) {
      return { usersProcessed: users.length, marketsScored: markets.length, runCreated: false };
    }

    for (const userId of users) {
      await step.run(`score-${userId}`, async () => {
        const [{ data: rating }, { data: catSnaps }, { data: bandSnaps }] = await Promise.all([
          supabase.from('user_rating_state').select('edge_score').eq('user_id', userId).single(),
          supabase
            .from('user_category_snapshots')
            .select('category,edge_contribution')
            .eq('user_id', userId)
            .eq('timeframe_key', 'ALL')
            .eq('venue_scope', 'combined'),
          supabase
            .from('user_probability_band_snapshots')
            .select('probability_band,win_rate')
            .eq('user_id', userId)
            .eq('timeframe_key', 'ALL')
            .eq('venue_scope', 'combined'),
        ]);

        const profile: UserSkillProfile = {
          edgeScore: rating?.edge_score ?? 50,
          categoryEdge: Object.fromEntries(
            (catSnaps ?? []).map((row) => [String(row.category ?? 'Other'), Number(row.edge_contribution ?? 0)]),
          ),
          bandPerformance: Object.fromEntries(
            (bandSnaps ?? []).map((row) => [String(row.probability_band), Number(row.win_rate ?? 0.5)]),
          ),
          venuePreference: 'polymarket',
        };

        const topResults = markets
          .map((market) => scoreOpportunity(market, profile))
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        await supabase.from('opportunity_rankings').delete().eq('user_id', userId);

        if (topResults.length === 0) return;

        await supabase.from('opportunity_rankings').insert(
          topResults.map((result) => ({
            user_id: userId,
            market_id: result.marketId,
            opportunity_score: result.score,
            components_json: result.components,
            explanation_text: result.explanation,
            recommended_action: result.recommendedAction,
            run_id: runId,
          })),
        );
      });
    }

    await step.run('complete-run', async () => {
      await supabase
        .from('engine_runs')
        .update({ ts_end: new Date().toISOString(), status: 'completed' })
        .eq('run_id', runId);
    });

    return { usersProcessed: users.length, marketsScored: markets.length, runCreated: true };
  },
);
