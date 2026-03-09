import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/next-auth-options';

type CookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component — can't set cookies, that's OK
          }
        },
      },
    }
  );

  (client.auth as any).getUser = async () => {
    try {
      const session = await getServerSession(authOptions);
      const address = session?.user?.address?.toLowerCase();

      if (!address) {
        return { data: { user: null }, error: null };
      }

      const admin = createAdminClient();
      const { data: userByHandle } = await admin
        .from('users')
        .select('user_id')
        .eq('handle', address)
        .maybeSingle();

      let userId = userByHandle?.user_id ?? null;

      if (!userId) {
        const { data: userBySettings } = await admin
          .from('users')
          .select('user_id')
          .contains('settings_json', { walletAddress: address })
          .maybeSingle();
        userId = userBySettings?.user_id ?? null;
      }

      if (!userId) {
        return { data: { user: null }, error: null };
      }

      return {
        data: {
          user: {
            id: userId,
          },
        },
        error: null,
      };
    } catch {
      return { data: { user: null }, error: null };
    }
  };

  return client;
}

// Admin client for background jobs (uses service role key, bypasses RLS)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
