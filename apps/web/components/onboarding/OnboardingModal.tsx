'use client';

import { Sparkles, Target, Trophy, Wallet2, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { AnimatedNumber } from '@/components/ui/animated-number';
import { EdgeScoreRing } from '@/components/ui/edge-score-ring';

import { SlidePanel } from '../panels/SlidePanel';

type Step = 0 | 1 | 2 | 3 | 4;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

function MiniEdgeRing({ score }: { score: number }) {
  return <EdgeScoreRing score={score} size={120} />;
}

export function OnboardingModal({ isOpen, onClose, onCompleted }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setWalletAddress('');
      setError(null);
      setProgress(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 3) return;

    const interval = setInterval(async () => {
      const response = await fetch('/api/venues/polymarket/sync-status', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      setProgress(payload);

      if (payload?.stages?.edgeScoreComputed || payload?.status === 'connected') {
        setStep(4);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, step]);

  const isWalletValid = walletAddress.startsWith('0x') && walletAddress.length === 42;

  const syncStages = useMemo(() => {
    const stages = progress?.stages ?? {};
    return [
      { label: 'Discovering markets...', done: !!stages.marketsDiscovered },
      { label: 'Importing trade history...', done: !!stages.tradesImported },
      { label: 'Building position cycles...', done: !!stages.positionsBuilt },
      { label: 'Computing your Edge Score...', done: !!stages.edgeScoreComputed },
    ];
  }, [progress?.stages]);

  async function connectAndSync() {
    if (!isWalletValid) {
      setError('Wallet must be a valid 0x address with 42 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const connect = await fetch('/api/venues/connect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ venueId: 'polymarket', externalAccountRef: walletAddress, accountLabel: 'Polymarket' }),
    });

    if (!connect.ok) {
      const payload = await connect.json().catch(() => ({}));
      setError(payload?.error ?? 'Failed to connect account.');
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
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Welcome to PolyPlot" subtitle="The Forecasting Arena" icon={<Sparkles size={16} />} width="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={['h-1.5 rounded-full transition-all', i === step ? 'w-8 bg-primary' : 'w-3 bg-border'].join(' ')} />
          ))}
        </div>

        {step === 0 ? (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#6366f1] mx-auto" />
            <h3 className="text-lg">The Forecasting Arena</h3>
            <p className="text-sm text-muted-foreground">Where forecasters compete to discover signals about the future.</p>
            <button onClick={() => setStep(1)} className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full">Get Started</button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">What PolyPlot Does</h3>
            <Feature icon={<Target size={15} />} title="Track Your Edge" body="A skill rating that measures how well you beat the market." />
            <Feature icon={<Zap size={15} />} title="Discover Signals" body="Find opportunities aligned with your strengths." />
            <Feature icon={<Trophy size={15} />} title="Compete & Compare" body="Climb the leaderboard and build your reputation." />
            <button onClick={() => setStep(2)} className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full">Continue</button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Connect Your Account</h3>
            <p className="text-xs text-muted-foreground">Enter your Polymarket proxy wallet address to import trades and compute your Edge Score.</p>
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value.trim())}
              placeholder="0x..."
              className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            />
            {error ? <p className="text-destructive text-sm mt-1">{error}</p> : null}
            <button disabled={!isWalletValid || submitting} onClick={connectAndSync} className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full disabled:opacity-50">
              {submitting ? 'Connecting...' : 'Connect Polymarket'}
            </button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Syncing your data...</h3>
            {syncStages.map((stage) => (
              <div key={stage.label} className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm flex items-center justify-between">
                <span>{stage.label}</span>
                <span className={stage.done ? 'text-[#22c55e]' : 'text-primary'}>{stage.done ? 'Done' : 'In progress'}</span>
              </div>
            ))}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4 text-center">
            <h3 className="text-sm font-medium">Your First Insight</h3>
            <div className="flex justify-center"><MiniEdgeRing score={Number(progress?.progress?.edgeScore ?? 50)} /></div>
            <p className="text-2xl text-primary">
              <AnimatedNumber value={Number(progress?.progress?.edgeScore ?? 50)} suffix="" />
            </p>
            <p className="text-xs text-muted-foreground">
              You have {progress?.progress?.trades ?? 0} trades and {progress?.progress?.resolvedDecisions ?? 0} resolved decisions. Your edge is now measurable.
            </p>
            <button
              onClick={() => {
                onCompleted?.();
                onClose();
              }}
              className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full"
            >
              Explore Your Dashboard
            </button>
          </div>
        ) : null}
      </div>
    </SlidePanel>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="inline-flex items-center gap-2 text-sm"><span className="text-primary">{icon}</span>{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </div>
  );
}
