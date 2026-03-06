import { serve } from 'inngest/next';

import { inngest } from '@/lib/inngest/client';
import { buildPositionsAndDecisions } from '@/lib/inngest/functions/build-positions';
import { checkAchievements } from '@/lib/inngest/functions/check-achievements';
import { computePercentiles } from '@/lib/inngest/functions/compute-percentiles';
import { computeRatings } from '@/lib/inngest/functions/compute-ratings';
import { computeSnapshots } from '@/lib/inngest/functions/compute-snapshots';
import { ingestMarkets } from '@/lib/inngest/functions/ingest-markets';
import { ingestPrices } from '@/lib/inngest/functions/ingest-prices';
import { runIntelligenceEngine } from '@/lib/inngest/functions/run-intelligence-engine';
import { syncUserData } from '@/lib/inngest/functions/sync-user-data';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ingestMarkets,
    ingestPrices,
    syncUserData,
    buildPositionsAndDecisions,
    computeRatings,
    computeSnapshots,
    checkAchievements,
    runIntelligenceEngine,
    computePercentiles,
  ],
});
