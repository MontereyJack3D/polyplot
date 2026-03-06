import { createAdminClient } from '@/lib/supabase/server';

import { inngest } from '../client';

interface RatingRow {
  user_id: string;
  edge_score: number;
}

export const computePercentiles = inngest.createFunction(
  { id: 'compute-percentiles', name: 'Compute Global Percentiles' },
  { cron: '0 5 * * *' },
  async ({ step }) => {
    const supabase = createAdminClient();

    await step.run('compute', async () => {
      const { data: users } = await supabase
        .from('user_rating_state')
        .select('user_id,edge_score')
        .order('edge_score', { ascending: true });

      const rows = (users ?? []) as RatingRow[];
      if (rows.length === 0) return;

      const total = rows.length;

      for (let index = 0; index < rows.length; index += 1) {
        const percentile = (index + 1) / total;
        await supabase
          .from('user_rating_state')
          .update({ percentile_global: Math.round(percentile * 1000) / 1000 })
          .eq('user_id', rows[index].user_id);
      }
    });

    return { completed: true };
  },
);
