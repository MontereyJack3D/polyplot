'use client';

import { AlertTriangle, Inbox } from 'lucide-react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 rounded-xl bg-secondary/70" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 rounded-xl bg-secondary/70" />
        <div className="h-28 rounded-xl bg-secondary/70" />
        <div className="h-28 rounded-xl bg-secondary/70" />
      </div>
      <div className="h-64 rounded-xl bg-secondary/70" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-xl bg-secondary/70" />
      <div className="h-48 rounded-xl bg-secondary/70" />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <Inbox className="mx-auto text-muted-foreground" size={20} />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export function DashboardEmpty() {
  return <EmptyState title="No dashboard data yet" body="Connect a venue and sync to start building your analytics." />;
}

export function ProfileEmpty() {
  return <EmptyState title="No profile stats yet" body="Complete a sync to populate your profile performance history." />;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
      <AlertTriangle className="mx-auto text-destructive" size={20} />
      <p className="mt-3 text-sm font-medium text-foreground">Unable to load data</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-3 py-1.5 text-xs rounded-lg border border-border bg-secondary hover:bg-secondary/80"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function usePageState(query: { isLoading: boolean; isError: boolean; data: unknown }) {
  if (query.isLoading) return { state: 'loading' as const };
  if (query.isError) return { state: 'error' as const };
  if (!query.data || (Array.isArray(query.data) && query.data.length === 0)) return { state: 'empty' as const };
  return { state: 'loaded' as const };
}
