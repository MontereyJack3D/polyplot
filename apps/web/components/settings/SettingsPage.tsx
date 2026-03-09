'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { ErrorState } from '@/components/shared/page-states';
import { useNFTGate } from '@/lib/hooks/use-nft-gate';
import { useSettingsProfile } from '@/lib/hooks/use-markets';
import { useFilterStore } from '@/lib/stores/filter-store';

import { VenueConnection } from './VenueConnection';

export function SettingsPage() {
  const settings = useSettingsProfile();
  const gate = useNFTGate();
  const { mode, setMode } = useFilterStore();

  const [displayName, setDisplayName] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'private' | 'public'>('private');
  const [defaultTimeframe, setDefaultTimeframe] = useState('30D');
  const [defaultVenueView, setDefaultVenueView] = useState<'combined' | 'polymarket' | 'kalshi'>('combined');
  const [saving, setSaving] = useState(false);

  const payload = settings.data as
    | {
        profile: {
          display_name: string;
          handle: string;
          privacy_mode: 'private' | 'public';
          default_timeframe: string;
          default_venue_view: 'combined' | 'polymarket' | 'kalshi';
          settings_json?: Record<string, unknown>;
        };
        venues: Array<any>;
      }
    | undefined;

  const lastSyncLabel = useMemo(() => {
    const latest = (payload?.venues ?? [])
      .map((venue) => venue.last_sync_at)
      .filter(Boolean)
      .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0];

    return latest ? formatDistanceToNowStrict(new Date(latest), { addSuffix: true }) : 'Never';
  }, [payload?.venues]);

  useEffect(() => {
    if (!payload) return;
    setDisplayName(payload.profile.display_name || '');
    setPrivacyMode(payload.profile.privacy_mode || 'private');
    setDefaultTimeframe(payload.profile.default_timeframe || '30D');
    setDefaultVenueView(payload.profile.default_venue_view || 'combined');
  }, [payload]);

  if (settings.isLoading) return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  if (settings.isError || !payload) return <ErrorState message="Failed to load settings" onRetry={() => settings.refetch()} />;

  async function saveProfile() {
    setSaving(true);
    await fetch('/api/settings/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        privacy_mode: privacyMode,
        default_timeframe: defaultTimeframe,
        default_venue_view: defaultVenueView,
        settings_json: {
          ...((payload?.profile?.settings_json as Record<string, unknown> | undefined) ?? {}),
          modePreference: mode,
        },
      }),
    });
    setSaving(false);
    settings.refetch();
  }

  async function syncVenue(venueId: string) {
    await fetch('/api/venues/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ venueId }),
    });
    settings.refetch();
  }

  async function disconnectVenue(venueId: string) {
    const confirmed = window.confirm('Disconnect this venue account?');
    if (!confirmed) return;

    await fetch(`/api/venues/${venueId}/disconnect`, { method: 'DELETE' });
    settings.refetch();
  }

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium">Profile</h2>
        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <Field label="Display Name">
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full" />
          </Field>
          <Field label="Handle">
            <input value={payload.profile.handle} readOnly className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full opacity-70" />
          </Field>
          <Field label="Wallet Address">
            <input value={gate.address || '—'} readOnly className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full opacity-70 font-mono" />
          </Field>
          <Field label="Make my profile public">
            <select value={privacyMode} onChange={(e) => setPrivacyMode(e.target.value as 'private' | 'public')} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full">
              <option value="private">No (private)</option>
              <option value="public">Yes (public)</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">Connected Accounts</h2>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('polyplot:open-onboarding'))}
            className="bg-primary text-primary-foreground font-medium py-2 px-3 rounded-lg text-xs"
          >
            Connect New Account
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Latest sync: {lastSyncLabel}</p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {payload.venues.map((venue) => (
            <VenueConnection key={venue.venue_id} venue={venue} onSync={syncVenue} onDisconnect={disconnectVenue} />
          ))}
          {payload.venues.length === 0 ? <p className="text-sm text-muted-foreground">No connected venues yet.</p> : null}
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium">Preferences</h2>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <Field label="Default timeframe">
            <select value={defaultTimeframe} onChange={(e) => setDefaultTimeframe(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full">
              <option value="7D">7D</option>
              <option value="30D">30D</option>
              <option value="YTD">YTD</option>
              <option value="1Y">1Y</option>
              <option value="ALL">ALL</option>
            </select>
          </Field>
          <Field label="Default venue view">
            <select value={defaultVenueView} onChange={(e) => setDefaultVenueView(e.target.value as 'combined' | 'polymarket' | 'kalshi')} className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm w-full">
              <option value="combined">Combined</option>
              <option value="polymarket">Polymarket</option>
              <option value="kalshi">Kalshi</option>
            </select>
          </Field>
          <Field label="Mode preference">
            <div className="inline-flex w-full items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1">
              <button onClick={() => setMode('normal')} className={['flex-1 px-2.5 py-1 rounded-md text-xs', mode === 'normal' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}>
                Normal
              </button>
              <button onClick={() => setMode('pro')} className={['flex-1 px-2.5 py-1 rounded-md text-xs', mode === 'pro' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}>
                Pro
              </button>
            </div>
          </Field>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium">Access</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Status: {gate.hasAccess ? 'NFT holder (granted)' : gate.isConnected ? 'Wallet connected, NFT required' : 'Wallet not connected'}
        </p>
      </section>

      <button onClick={saveProfile} disabled={saving} className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full md:w-auto disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-muted-foreground">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
