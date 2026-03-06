'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAccess } from '@/lib/hooks/use-access';

export function AccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useAccess();

  useEffect(() => {
    if (!isLoading && data && !data.eligible) {
      router.replace('/access-code');
    }
  }, [data, isLoading, router]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-24 w-full animate-pulse rounded bg-secondary" />
        <div className="h-24 w-full animate-pulse rounded bg-secondary" />
      </div>
    );
  }

  if (!data.eligible) {
    return (
      <div className="flex h-full min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
