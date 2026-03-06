'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAccess } from '@/lib/hooks/use-access';

export function AccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useAccess();

  useEffect(() => {
    if (!isLoading && data && !data.eligible) {
      router.push('/access-code');
    }
  }, [data, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] animate-pulse" />
      </div>
    );
  }

  if (!data?.eligible) return null;

  return <>{children}</>;
}
