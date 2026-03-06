'use client';

import { CheckCircle2, ChevronDown, Loader2, Wallet2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { EdgeScoreRing } from '@/components/ui/edge-score-ring';

import { SlidePanel } from '../panels/SlidePanel';

type Step = 1 | 2 | 3 | 4;

interface VenueConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function VenueConnectionModal({ isOpen, onClose, onConnected }: VenueConnectionModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [walletAddress, setWalletAddress] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poll, setPoll] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setWalletAddress('');
      setShowHelp(false);
      setError(null);
      setPoll(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== 3 || !isOpen) return;

    const interval = setInterval(async () => {
      const response = await fetch('/api/venues/polymarket/sync-status', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setPoll(payload);

      if (payload?.stages?.edgeScoreComputed || payload?.status === 'connected') {
        setStep(4);
        onConnected?.();
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, onConnected, step]);

  const isWalletValid = walletAddress.startsWith('0x') && walletAddress.length === 42;

  const syncStages = useMemo(() => {
    const stages = poll?.stages ?? {};
    return [
      { key: 'marketsDiscovered', label: 'Discovering markets...', done: !!stages.marketsDiscovered },
      { key: 'tradesImported', label: 'Importing trade history...', done: !!stages.tradesImported },
      { key: 'positionsBuilt', label: 'Building position cycles...', done: !!stages.positionsBuilt },
      { key: 'edgeScoreComputed', label: 'Computing your Edge Score...', done: !!stages.edgeScoreComputed },
    ];
  }, [poll?.stages]);

  const insight = poll?.progress
    ? `You've made ${poll.progress.trades} trades. Current Edge Score is ${Number(poll.progress.edgeScore ?? 50).toFixed(1)}.`
    : 'Your first insights are being prepared.';

  async function handleConnect() {
    if (!isWalletValid) {
      setError('Wallet address must start with 0x and be 42 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const connectResponse = await fetch('/api/venues/connect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ venueId: 'polymarket', externalAccountRef: walletAddress, accountLabel: 'Polymarket' }),
    });

    if (!connectResponse.ok) {
      const payload = await connectResponse.json().catch(() => ({}));
      setError(payload?.error ?? 'Failed to connect venue account.');
      setSubmitting(false);
      return;
    }

    await fetch('/api/venues/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ venueId: 'polymarket' }),
    });

    setSubmitting(false);
    setStep(3);
  }

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Connect Venue" subtitle="Import your forecasting history" icon={<Wallet2 size={16} />} width="md">
      {step === 1 ? (
        <div className="space-y-3">
          <button onClick={() => setStep(2)} className="w-full text-left rounded-xl border border-primary/30 bg-primary/10 p-4 hover:border-primary transition-colors">
            <p className="text-sm font-medium">Polymarket</p>
            <p className="text-xs text-muted-foreground mt-1">Connect with proxy wallet address</p>
          </button>
          <div className="w-full rounded-xl border border-border bg-secondary/30 p-4 opacity-70">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Kalshi</p>
              <span className="text-[10px] rounded-full bg-indigo-500/15 text-indigo-300 px-2 py-0.5">Coming Soon</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">API key connection arrives in Phase 2.</p>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Connect Polymarket</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your Polymarket proxy wallet address. You can find this in Polymarket settings under Deposit Address.
            </p>
          </div>

          <div>
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value.trim())}
              placeholder="0x..."
              className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            />
            {error ? <p className="text-destructive text-sm mt-1">{error}</p> : null}
          </div>

          <div className="rounded-lg border border-border bg-secondary/30">
            <button onClick={() => setShowHelp((v) => !v)} className="w-full px-3 py-2 text-xs text-left inline-flex items-center justify-between">
              How to find your wallet address
              <ChevronDown size={14} className={showHelp ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
            {showHelp ? (
              <div className="px-3 pb-3 text-xs text-muted-foreground space-y-1">
                <p>1. Open Polymarket and sign in.</p>
                <p>2. Go to account settings.</p>
                <p>3. Locate “Deposit Address” / proxy wallet address.</p>
                <p>4. Copy the 0x address and paste it here.</p>
              </div>
            ) : null}
          </div>

          <button
            disabled={!isWalletValid || submitting}
            onClick={handleConnect}
            className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Syncing your data...</h3>
          <div className="space-y-2">
            {syncStages.map((stage) => (
              <div key={stage.key} className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm flex items-center gap-2">
                {stage.done ? <CheckCircle2 size={14} className="text-[#22c55e]" /> : <Loader2 size={14} className="animate-spin text-primary" />}
                <span>{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4 text-center">
          <h3 className="text-sm font-medium">Your Edge Score</h3>
          <div className="flex justify-center">
            <EdgeScoreRing score={Number(poll?.progress?.edgeScore ?? 50)} size={160} />
          </div>
          <p className="text-xs text-muted-foreground">{insight}</p>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : null}
    </SlidePanel>
  );
}
