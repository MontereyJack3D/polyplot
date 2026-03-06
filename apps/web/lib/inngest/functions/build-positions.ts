import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

type MarketNested = {
  market_id: string;
  status: string;
};

type TradeRow = {
  trade_id: string;
  market_id: string;
  ts: string;
  side: 'YES' | 'NO';
  direction: 'buy' | 'sell';
  quantity: number;
  price_prob: number;
  markets: MarketNested[] | null;
};

export const buildPositionsAndDecisions = inngest.createFunction(
  { id: 'build-positions-decisions', name: 'Build Position Cycles and Decisions' },
  { event: 'user/sync.completed' },
  async ({ event, step }) => {
    const { userId, venueId } = event.data;
    const supabase = createAdminClient();

    const trades = await step.run('get-trades', async () => {
      const { data } = await supabase
        .from('trades')
        .select('trade_id, market_id, ts, side, direction, quantity, price_prob, markets(market_id,status)')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .order('ts', { ascending: true });

      return (data ?? []) as TradeRow[];
    });

    await step.run('build-cycles', async () => {
      const tradesByMarket = new Map<string, TradeRow[]>();
      for (const trade of trades) {
        const key = trade.market_id;
        if (!tradesByMarket.has(key)) {
          tradesByMarket.set(key, []);
        }
        tradesByMarket.get(key)!.push(trade);
      }

      for (const [marketId, marketTrades] of tradesByMarket.entries()) {
        let netQty = 0;
        let cycleStart: TradeRow | null = null;
        let cycleTrades: TradeRow[] = [];
        let side: 'YES' | 'NO' | null = null;

        for (const trade of marketTrades) {
          const delta = trade.direction === 'buy' ? trade.quantity : -trade.quantity;

          if (Math.abs(netQty) < 0.001 && delta !== 0) {
            cycleStart = trade;
            side = trade.side;
            cycleTrades = [trade];
          } else {
            cycleTrades.push(trade);
          }

          netQty += delta;

          if (Math.abs(netQty) < 0.001 && cycleStart && cycleTrades.length > 0) {
            const buyTrades = cycleTrades.filter((t) => t.direction === 'buy');
            const sellTrades = cycleTrades.filter((t) => t.direction === 'sell');

            const buyQty = buyTrades.reduce((sum, t) => sum + t.quantity, 0);
            const sellQty = sellTrades.reduce((sum, t) => sum + t.quantity, 0);

            const avgEntryProb =
              buyQty > 0
                ? buyTrades.reduce((sum, t) => sum + t.price_prob * t.quantity, 0) / buyQty
                : cycleStart.price_prob;

            const avgExitProb =
              sellQty > 0
                ? sellTrades.reduce((sum, t) => sum + t.price_prob * t.quantity, 0) / sellQty
                : null;

            const costBasis = buyTrades.reduce((sum, t) => sum + t.price_prob * t.quantity, 0);
            const proceeds = sellTrades.reduce((sum, t) => sum + t.price_prob * t.quantity, 0);
            const realizedPnl = proceeds - costBasis;

            const { data: position } = await supabase
              .from('positions')
              .insert({
                user_id: userId,
                venue_id: venueId,
                market_id: marketId,
                position_side: side || 'YES',
                status: 'closed',
                opened_at: cycleStart.ts,
                closed_at: cycleTrades[cycleTrades.length - 1].ts,
                net_quantity: 0,
                avg_entry_prob: avgEntryProb,
                avg_exit_prob: avgExitProb,
                cost_basis: costBasis,
                realized_pnl: realizedPnl,
                roi_realized: costBasis > 0 ? realizedPnl / costBasis : 0,
              })
              .select('position_id')
              .single<{ position_id: string }>();

            if (position) {
              const probBand =
                avgEntryProb < 0.2
                  ? '0-20'
                  : avgEntryProb < 0.4
                    ? '20-40'
                    : avgEntryProb < 0.6
                      ? '40-60'
                      : avgEntryProb < 0.8
                        ? '60-80'
                        : '80-100';

              const { data: resolution } = await supabase
                .from('resolutions')
                .select('resolved_at, outcome')
                .eq('market_id', marketId)
                .maybeSingle<{ resolved_at: string; outcome: string }>();

              const isResolved = !!resolution;
              const y = resolution ? (resolution.outcome === 'YES' ? 1 : 0) : null;
              const capture = avgExitProb !== null ? avgExitProb - avgEntryProb : null;

              let expectedE: number | null = null;
              let actualS: number | null = null;
              if (isResolved && y !== null) {
                expectedE = side === 'YES' ? avgEntryProb : 1 - avgEntryProb;
                actualS = side === 'YES' ? y : 1 - y;
              }

              const { data: decision } = await supabase
                .from('decisions')
                .insert({
                  user_id: userId,
                  venue_id: venueId,
                  market_id: marketId,
                  position_id: position.position_id,
                  entry_ts: cycleStart.ts,
                  exit_ts: cycleTrades[cycleTrades.length - 1].ts,
                  resolved_ts: resolution?.resolved_at || null,
                  side: side || 'YES',
                  p_in: avgEntryProb,
                  p_out: avgExitProb,
                  y,
                  is_resolved: isResolved,
                  is_early_exit: !isResolved && avgExitProb !== null,
                  expected_E: expectedE,
                  actual_S: actualS,
                  capture,
                  probability_band: probBand,
                  weight_size: Math.min(Math.sqrt(costBasis / 100), 2),
                })
                .select('decision_id')
                .single<{ decision_id: string }>();

              if (decision && isResolved) {
                await inngest.send({
                  name: 'decision/created',
                  data: {
                    decisionId: decision.decision_id,
                    userId,
                    marketId,
                    isResolved: true,
                  },
                });
              }
            }

            netQty = 0;
            cycleStart = null;
            cycleTrades = [];
            side = null;
          }
        }
      }
    });

    return { userId, venueId, tradesProcessed: trades.length };
  }
);
