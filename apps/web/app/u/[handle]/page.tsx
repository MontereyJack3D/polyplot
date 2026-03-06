import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicProfile } from '@/components/profile/PublicProfile';
import { createAdminClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from('users')
    .select('user_id, display_name, handle, privacy_mode')
    .eq('handle', handle)
    .single();

  if (user && user.privacy_mode === 'private') {
    return {
      title: 'Profile Not Found — PolyPlot',
      description: 'This profile is private.',
    };
  }

  const { data: rating } = user
    ? await supabase.from('user_rating_state').select('edge_score').eq('user_id', user.user_id).single()
    : { data: null as null | { edge_score: number } };

  const title = user ? `${user.display_name || user.handle} — PolyPlot` : 'PolyPlot';
  const description = user
    ? `Edge Score: ${rating?.edge_score?.toFixed(1) ?? '—'} | ${user.handle} on PolyPlot — The Forecasting Arena`
    : 'PolyPlot — The Forecasting Arena';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'PolyPlot',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { handle } = await params;
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('privacy_mode')
    .eq('handle', handle)
    .single();

  if (!user || user.privacy_mode === 'private') {
    notFound();
  }

  return <PublicProfile handle={handle} />;
}
