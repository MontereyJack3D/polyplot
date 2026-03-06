import { PolymarketConnector } from '@polyplot/connectors';

import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

type OpenMarketRow = {
  market_id: string;
  venue_market_id: string;
};

export const ingestPrices = inngest.createFunction(
  { id: 'ingest-prices', name: 'Ingest Market Prices' },
  { cron: '*/5 * * * *' },
  async ({ step }) => {
    const connector = new PolymarketConnector();
    const supabase = createAdminClient();

    const openMarkets = await step.run('get-open-markets', async () => {
      const { data } = await supabase
        .from('markets')
        .select('market_id, venue_market_id')
        .eq('venue_id', 'polymarket')
        .eq('status', 'open');

      return (data ?? []) as OpenMarketRow[];
    });

    const prices = await step.run('fetch-prices', async () => {
      return connector.fetchPrices(
        openMarkets.map((market) => ({
          marketId: market.market_id,
          venueMarketId: market.venue_market_id,
        }))
      );
    });

    const insertResult = await step.run('insert-prices', async () => {
      const marketIdByVenueMarketId = new Map(openMarkets.map((m) => [m.venue_market_id, m.market_id]));

      const rows = prices
        .map((price) => {
          const internalMarketId = marketIdByVenueMarketId.get(price.marketId as string);
          if (!internalMarketId) {
            return null;
          }

          return {
            market_id: internalMarketId,
            ts: new Date().toISOString(),
            mid_prob: price.midProb,
            best_bid_prob: price.bestBidProb,
            best_ask_prob: price.bestAskProb,
            spread: price.spread,
            volume_24h: price.volume24h,
            liquidity_score: price.liquidityScore,
            stability_score: price.stabilityScore,
            source: 'venue',
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      let inserted = 0;
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const { error } = await supabase.from('market_prices').insert(chunk);

        if (error) {
          console.error('Price insert error:', error);
        } else {
          inserted += chunk.length;
        }
      }

      return { inserted };
    });

    return { marketsChecked: openMarkets.length, pricesInserted: insertResult.inserted };
  }
);
