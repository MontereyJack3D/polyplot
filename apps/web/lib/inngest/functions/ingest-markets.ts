import { PolymarketConnector } from '@polyplot/connectors';

import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

type ResolutionEvent = {
  name: 'market/resolved';
  data: {
    marketId: string;
    venueMarketId: string;
    venueId: string;
    outcome: string;
    settlementProb: number;
  };
};

export const ingestMarkets = inngest.createFunction(
  { id: 'ingest-markets', name: 'Ingest Markets from Polymarket' },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const connector = new PolymarketConnector();
    const supabase = createAdminClient();

    const markets = await step.run('fetch-markets', async () => connector.fetchMarkets());

    const upsertResult = await step.run('upsert-markets', async () => {
      let inserted = 0;
      let updated = 0;

      for (const market of markets) {
        const { data, error } = await supabase
          .from('markets')
          .upsert(
            {
              venue_id: 'polymarket',
              venue_market_id: market.venueMarketId,
              question: market.question,
              description: market.description,
              category_raw: market.categoryRaw,
              subcategory_raw: market.subcategoryRaw,
              subsubcategory_raw: market.subsubcategoryRaw,
              tags: market.tags,
              start_time: market.startTime,
              end_time: market.endTime,
              status: market.status,
              fee_bps: market.feeBps,
              url: market.url,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'venue_id,venue_market_id' }
          )
          .select('market_id');

        if (error) {
          console.error('Market upsert error:', error);
          continue;
        }

        if (data && data.length > 0) {
          inserted += 1;
        } else {
          updated += 1;
        }
      }

      return { total: markets.length, inserted, updated };
    });

    const resolutions = await step.run('check-resolutions', async () => {
      const resolved = await connector.fetchResolutions();
      const events: ResolutionEvent[] = [];

      for (const res of resolved) {
        const { data: market } = await supabase
          .from('markets')
          .select('market_id')
          .eq('venue_id', 'polymarket')
          .eq('venue_market_id', res.venueMarketId)
          .maybeSingle<{ market_id: string }>();

        if (!market) {
          continue;
        }

        const { data: existing } = await supabase
          .from('resolutions')
          .select('resolution_id')
          .eq('market_id', market.market_id)
          .limit(1);

        if (existing && existing.length > 0) {
          continue;
        }

        await supabase.from('resolutions').upsert(
          {
            market_id: market.market_id,
            resolved_at: res.resolvedAt,
            outcome: res.outcome,
            settlement_prob: res.settlementProb,
            resolution_source: 'polymarket',
          },
          { onConflict: 'market_id' }
        );

        await supabase.from('markets').update({ status: 'resolved' }).eq('market_id', market.market_id);

        events.push({
          name: 'market/resolved',
          data: {
            marketId: market.market_id,
            venueMarketId: res.venueMarketId,
            venueId: 'polymarket',
            outcome: res.outcome,
            settlementProb: res.settlementProb,
          },
        });
      }

      return events;
    });

    if (resolutions.length > 0) {
      await step.sendEvent('emit-resolutions', resolutions);
    }

    return {
      marketsProcessed: upsertResult.total,
      resolutionsFound: resolutions.length,
    };
  }
);
