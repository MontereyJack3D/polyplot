import { PolymarketConnector } from '@polyplot/connectors';

import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

type TradeWithMarket = {
  market_id: string;
};

type PositionWithMarket = {
  market_id: string;
};

export const syncUserData = inngest.createFunction(
  {
    id: 'sync-user-data',
    name: 'Sync User Data from Venue',
    concurrency: { limit: 5 },
    throttle: { limit: 1, period: '30s', key: 'event.data.userId' },
  },
  { event: 'user/sync.requested' },
  async ({ event, step }) => {
    const { userId, venueId, walletAddress } = event.data;
    const connector = new PolymarketConnector();
    const supabase = createAdminClient();

    const tradesResult = await step.run('fetch-trades', async () => {
      const trades = await connector.fetchTrades(walletAddress, userId);
      let newTradeCount = 0;

      for (const trade of trades) {
        const venueMarketId = trade.marketId as unknown as string;

        const { data: market } = await supabase
          .from('markets')
          .select('market_id')
          .eq('venue_id', 'polymarket')
          .eq('venue_market_id', venueMarketId)
          .maybeSingle<TradeWithMarket>();

        if (!market) continue;

        const rawRef = `${walletAddress}-${trade.ts}-${venueMarketId}-${trade.side}`;
        const { error } = await supabase.from('trades').upsert(
          {
            user_id: userId,
            venue_id: 'polymarket',
            market_id: market.market_id,
            ts: trade.ts,
            side: trade.side,
            direction: trade.direction,
            quantity: trade.quantity,
            price_prob: trade.priceProb,
            fee_paid: trade.feePaid || 0,
            tx_ref: trade.txRef,
            status: 'filled',
            raw_ref_id: rawRef,
          },
          { onConflict: 'raw_ref_id', ignoreDuplicates: true }
        );

        if (!error) {
          newTradeCount += 1;
        }
      }

      return { newTradeCount };
    });

    await step.run('sync-positions', async () => {
      const positions = await connector.fetchPositions(walletAddress, userId);

      for (const position of positions) {
        const venueMarketId = position.marketId as unknown as string;

        const { data: market } = await supabase
          .from('markets')
          .select('market_id')
          .eq('venue_id', 'polymarket')
          .eq('venue_market_id', venueMarketId)
          .maybeSingle<PositionWithMarket>();

        if (!market) continue;

        await supabase.from('positions').upsert({
          user_id: userId,
          venue_id: 'polymarket',
          market_id: market.market_id,
          position_side: position.positionSide,
          status: position.status,
          net_quantity: position.netQuantity,
          avg_entry_prob: position.avgEntryProb,
          cost_basis: position.costBasis,
          current_value: position.currentValue,
          realized_pnl: position.realizedPnl,
          unrealized_pnl: position.unrealizedPnl,
          last_mark_prob: position.lastMarkProb,
          last_mark_ts: new Date().toISOString(),
        });
      }
    });

    await step.run('sync-balances', async () => {
      const balances = await connector.fetchBalances(walletAddress, userId);
      await supabase.from('venue_balances').insert({
        user_id: userId,
        venue_id: 'polymarket',
        total_balance: balances.totalBalance,
        used_balance: balances.usedBalance,
        available_balance: balances.availableBalance,
        pnl_24h: balances.pnl24h,
        source: 'venue',
      });
    });

    await step.run('update-sync-status', async () => {
      await supabase
        .from('venue_accounts')
        .update({ last_sync_at: new Date().toISOString(), connection_status: 'connected' })
        .eq('user_id', userId)
        .eq('venue_id', venueId);
    });

    await step.sendEvent('sync-completed', {
      name: 'user/sync.completed',
      data: {
        userId,
        venueId,
        newTradeCount: tradesResult.newTradeCount,
      },
    });

    return { userId, venueId, newTradeCount: tradesResult.newTradeCount };
  }
);
