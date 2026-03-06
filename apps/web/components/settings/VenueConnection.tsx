'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { RefreshCw } from 'lucide-react';

interface VenueConnectionProps {
  venue: {
    venue_id: 'polymarket' | 'kalshi';
    external_account_ref: string;
    connection_status: 'connected' | 'disconnected' | 'syncing' | 'error';
    last_sync_at: string | null;
  };
  onSync: (venueId: string) => void;
  onDisconnect: (venueId: string) => void;
}

export function VenueConnection({ venue, onSync, onDisconnect }: VenueConnectionProps) {
  const connected = venue.connection_status === 'connected';

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium capitalize">{venue.venue_id}</p>
          <p className="text-xs text-muted-foreground mt-1">{venue.external_account_ref}</p>
        </div>
        <span className={['inline-flex items-center gap-1 text-xs', connected ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
          <span className={['h-2 w-2 rounded-full', connected ? 'bg-[#22c55e]' : 'bg-[#ef4444]'].join(' ')} />
          {venue.connection_status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Last sync: {venue.last_sync_at ? formatDistanceToNowStrict(new Date(venue.last_sync_at), { addSuffix: true }) : 'Never'}
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onSync(venue.venue_id)} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs inline-flex items-center gap-1.5">
          <RefreshCw size={12} /> Sync Now
        </button>
        <button onClick={() => onDisconnect(venue.venue_id)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs">
          Disconnect
        </button>
      </div>
    </div>
  );
}
