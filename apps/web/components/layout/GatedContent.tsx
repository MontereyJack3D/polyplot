'use client';

import { useEffect, useState } from 'react';

import { useNFTGate } from '@/lib/hooks/use-nft-gate';
import { useVenueAccounts } from '@/lib/hooks/use-venue-accounts';

import { PolyPlotConnectButton } from './ConnectButton';

interface GatedContentProps {
  children: React.ReactNode;
}

export function GatedContent({ children }: GatedContentProps) {
  const { isConnected, isLoading, hasAccess, refresh } = useNFTGate();
  const venueAccounts = useVenueAccounts();
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    if (hasAccess && isConnected) {
      fetch('/api/users/ensure', { method: 'POST' }).catch(() => undefined);
    }
  }, [hasAccess, isConnected]);

  async function redeemAccessCode() {
    setRedeemError(null);
    setIsRedeeming(true);
    try {
      const response = await fetch('/api/access/code/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const payload = (await response.json()) as { access?: string; error?: string };
      if (!response.ok || payload.access !== 'granted') {
        setRedeemError('Invalid or expired code');
        return;
      }
      setCode('');
      await refresh();
    } catch {
      setRedeemError('Unable to redeem code right now');
    } finally {
      setIsRedeeming(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] animate-pulse" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-foreground text-xl font-medium mb-2">Connect to unlock</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Connect your wallet to access your personalized dashboard, track your Edge Score, and compete on the leaderboard.
          </p>
        </div>
        <PolyPlotConnectButton />
      </div>
    );
  }

  if (hasAccess && venueAccounts.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] animate-pulse" />
      </div>
    );
  }

  if (hasAccess && !venueAccounts.hasConnectedVenue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M8 12h8" />
            <path d="M12 8v8" />
            <rect x="3" y="3" width="18" height="18" rx="3" />
          </svg>
        </div>
        <div>
          <h2 className="text-foreground text-xl font-medium mb-2">Connect your prediction markets</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Link your Polymarket or Kalshi account to unlock Dashboard, Profile, and History with your real performance data.
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('polyplot:open-onboarding'))}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Connect Prediction Markets
        </button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h2 className="text-foreground text-xl font-medium mb-2">NFT Required</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            PolyPlot is currently in private alpha. You need to hold a PolyPlot Access NFT to unlock the full experience.
          </p>
          <p className="text-muted-foreground text-xs mt-3 font-mono">Contract: 0xbad6...f731</p>
        </div>
        <div className="w-full max-w-sm space-y-2 text-left">
          <label className="block text-xs text-muted-foreground">Have an access code?</label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="ALPHA-XXXX-XXXX"
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
            <button
              onClick={redeemAccessCode}
              disabled={!code || isRedeeming}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              {isRedeeming ? 'Checking...' : 'Redeem'}
            </button>
          </div>
          {redeemError ? <p className="text-destructive text-xs">{redeemError}</p> : null}
        </div>
        <a
          href="https://opensea.io/collection/polyplot-access"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Get Access NFT
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
