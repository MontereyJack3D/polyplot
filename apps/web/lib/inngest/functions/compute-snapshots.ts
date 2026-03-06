import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

type SyncCompletedEvent = {
  data?: {
    userId?: string;
  };
};

type VenueAccountRow = {
  user_id: string;
};

type DecisionSnapshotRow = {
  entry_ts: string;
  venue_id: string;
  is_resolved: boolean;
  actual_S: number | null;
  expected_E: number | null;
  weight_size: number | null;
  probability_band: string | null;
  rating_delta_final: number | null;
  log_loss: number | null;
};

export const computeSnapshots = inngest.createFunction(
  {
    id: 'compute-snapshots',
    name: 'Compute Analytics Snapshots',
    concurrency: { limit: 10 },
  },
  [{ cron: '0 3 * * *' }, { event: 'user/sync.completed' }],
  async ({ event, step }) => {
    const supabase = createAdminClient();

    let userIds: string[] = [];
    const eventData = (event as SyncCompletedEvent | undefined)?.data;

    if (eventData?.userId) {
      userIds = [eventData.userId];
    } else {
      const { data } = await supabase
        .from('venue_accounts')
        .select('user_id')
        .eq('connection_status', 'connected');
      userIds = [...new Set(((data ?? []) as VenueAccountRow[]).map((d) => d.user_id))];
    }

    for (const userId of userIds) {
      await step.run(`snapshot-${userId}`, async () => {
        const timeframes = ['7D', '30D', 'YTD', '1Y', 'ALL'] as const;
        const venueScopes = ['combined', 'polymarket'] as const;

        for (const tf of timeframes) {
          for (const vs of venueScopes) {
            const endDate = new Date();
            let startDate: Date;

            switch (tf) {
              case '7D':
                startDate = new Date(Date.now() - 7 * 86_400_000);
                break;
              case '30D':
                startDate = new Date(Date.now() - 30 * 86_400_000);
                break;
              case 'YTD':
                startDate = new Date(endDate.getFullYear(), 0, 1);
                break;
              case '1Y':
                startDate = new Date(Date.now() - 365 * 86_400_000);
                break;
              default:
                startDate = new Date(0);
            }

            let query = supabase
              .from('decisions')
              .select('entry_ts, venue_id, is_resolved, actual_S, expected_E, weight_size, probability_band, rating_delta_final, log_loss')
              .eq('user_id', userId)
              .gte('entry_ts', startDate.toISOString())
              .lte('entry_ts', endDate.toISOString());

            if (vs !== 'combined') {
              query = query.eq('venue_id', vs);
            }

            const { data: decisionsRaw } = await query;
            const decisions = (decisionsRaw ?? []) as DecisionSnapshotRow[];

            if (decisions.length === 0) {
              continue;
            }

            const resolved = decisions.filter((d) => d.is_resolved);
            const wins = resolved.filter((d) => d.actual_S !== null && d.actual_S > 0.5);
            const winRate = resolved.length > 0 ? wins.length / resolved.length : null;
            const totalPnl = decisions.reduce((sum, d) => {
              if (d.actual_S !== null && d.expected_E !== null) {
                return sum + (d.actual_S - d.expected_E) * (d.weight_size || 1);
              }
              return sum;
            }, 0);

            const sortedResolved = [...resolved].sort(
              (a, b) => new Date(a.entry_ts).getTime() - new Date(b.entry_ts).getTime()
            );

            let bestStreak = 0;
            let runningStreak = 0;
            for (const d of sortedResolved) {
              if (d.actual_S !== null && d.actual_S > 0.5) {
                runningStreak += 1;
                bestStreak = Math.max(bestStreak, runningStreak);
              } else {
                runningStreak = 0;
              }
            }
            const currentStreak = runningStreak;

            const { count: activeCount } = await supabase
              .from('positions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('status', 'open');

            await supabase.from('user_metric_snapshots').upsert(
              {
                user_id: userId,
                timeframe_key: tf,
                venue_scope: vs,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                trade_count: decisions.length,
                win_rate: winRate,
                roi: totalPnl,
                pnl_total: totalPnl,
                win_streak_current: currentStreak,
                win_streak_best: bestStreak,
                active_markets_count: activeCount || 0,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,timeframe_key,venue_scope,coalesce(custom_key,\'\')' }
            );

            const bands = ['0-20', '20-40', '40-60', '60-80', '80-100'] as const;
            for (const band of bands) {
              const bandDecisions = decisions.filter((d) => d.probability_band === band);
              if (bandDecisions.length === 0) {
                continue;
              }

              const bandResolved = bandDecisions.filter((d) => d.is_resolved);
              const bandWins = bandResolved.filter((d) => d.actual_S !== null && d.actual_S > 0.5);

              await supabase.from('user_probability_band_snapshots').upsert(
                {
                  user_id: userId,
                  timeframe_key: tf,
                  venue_scope: vs,
                  probability_band: band,
                  trade_count: bandDecisions.length,
                  win_rate: bandResolved.length > 0 ? bandWins.length / bandResolved.length : null,
                  edge_contribution: bandDecisions.reduce((sum, d) => sum + (d.rating_delta_final || 0), 0),
                  log_loss_avg:
                    bandResolved.length > 0
                      ? bandResolved.reduce((sum, d) => sum + (d.log_loss || 0), 0) / bandResolved.length
                      : null,
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict:
                    'user_id,timeframe_key,venue_scope,coalesce(category,\'\'),probability_band,coalesce(custom_key,\'\')',
                }
              );
            }
          }
        }
      });
    }

    return { usersProcessed: userIds.length };
  }
);
