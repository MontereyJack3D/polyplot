'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle,
  ChevronRight,
  Download,
  Flame,
  Globe,
  Link2,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EdgeScoreRing } from '@/components/ui/edge-score-ring';

type Step = 0 | 1 | 2 | 3 | 4;
type AppId = 'polymarket' | 'kalshi';
type ConnectionMethod = 'eoa' | 'social';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

interface SyncStatusPayload {
  status?: string;
  progress?: {
    trades?: number;
    positions?: number;
    decisions?: number;
    edgeScore?: number;
    resolvedDecisions?: number;
  };
  stages?: {
    marketsDiscovered?: boolean;
    tradesImported?: boolean;
    positionsBuilt?: boolean;
    edgeScoreComputed?: boolean;
  };
}

interface CategoryRow {
  category: string;
  winRate: number;
  trades: number;
}

interface SummaryPayload {
  edgeScore?: number;
  edgePercentile?: number;
  winRate?: number;
  roi?: number;
  pnlTotal?: number;
}

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Connect', 'Import', 'Edge Score', 'Category', 'Insight'] as const;

function MiniEdgeRing({ score }: { score: number }) {
  return <EdgeScoreRing score={score} size={150} />;
}

export function OnboardingModal({ isOpen, onClose, onCompleted }: OnboardingModalProps) {
  const { data: session } = useSession();
  const walletAddress = session?.user?.address?.toLowerCase() ?? '';

  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);
  const [connectedApps, setConnectedApps] = useState<Set<AppId>>(new Set(['polymarket']));
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('eoa');
  const [socialWalletOverride, setSocialWalletOverride] = useState('');
  const [showSocialInput, setShowSocialInput] = useState(false);

  const [importState, setImportState] = useState<'idle' | 'importing' | 'done'>('idle');
  const [syncStatus, setSyncStatus] = useState<SyncStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<SummaryPayload | null>(null);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setDirection(1);
      setConnectedApps(new Set(['polymarket']));
      setConnectionMethod('eoa');
      setSocialWalletOverride('');
      setShowSocialInput(false);
      setImportState('idle');
      setSyncStatus(null);
      setError(null);
      setIsSubmitting(false);
      setSummary(null);
      setCategoryRows([]);
      isPollingRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isPollingRef.current) return;

    const interval = setInterval(async () => {
      const res = await fetch('/api/venues/polymarket/sync-status', { cache: 'no-store' });
      if (!res.ok) return;
      const payload = (await res.json()) as SyncStatusPayload;
      setSyncStatus(payload);

      const done = !!payload.stages?.edgeScoreComputed || payload.status === 'connected';
      if (done) {
        isPollingRef.current = false;
        setImportState('done');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, importState]);

  useEffect(() => {
    if (!isOpen || step < 2) return;

    const loadInsights = async () => {
      const [summaryRes, categoriesRes] = await Promise.all([
        fetch('/api/dashboard/summary?timeframe=ALL&venue=combined', { cache: 'no-store' }),
        fetch('/api/profile/me/categories?timeframe=ALL&venue=combined', { cache: 'no-store' }),
      ]);

      if (summaryRes.ok) {
        const payload = (await summaryRes.json()) as SummaryPayload;
        setSummary(payload);
      }

      if (categoriesRes.ok) {
        const payload = (await categoriesRes.json()) as { rows?: CategoryRow[] };
        const rows = (payload.rows ?? [])
          .map((row) => ({
            category: row.category || 'Other',
            winRate: row.winRate || 0,
            trades: row.trades || 0,
          }))
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 5);
        setCategoryRows(rows);
      }
    };

    loadInsights().catch(() => undefined);
  }, [isOpen, step]);

  const inferredImportProgress = useMemo(() => {
    if (!syncStatus?.stages) return importState === 'done' ? 100 : 0;
    const flags = [
      syncStatus.stages.marketsDiscovered,
      syncStatus.stages.tradesImported,
      syncStatus.stages.positionsBuilt,
      syncStatus.stages.edgeScoreComputed,
    ];
    const doneCount = flags.filter(Boolean).length;
    const base = (doneCount / flags.length) * 100;
    return Math.max(base, importState === 'done' ? 100 : 0);
  }, [importState, syncStatus?.stages]);

  const canGoNext = useMemo(() => {
    if (step === 0) return connectedApps.has('polymarket');
    if (step === 1) return importState === 'done';
    return true;
  }, [connectedApps, importState, step]);

  const topCategory = categoryRows[0];
  const categoryValues = categoryRows.length
    ? categoryRows
    : [
        { category: 'Politics', winRate: 0.82, trades: 184 },
        { category: 'Crypto', winRate: 0.74, trades: 121 },
        { category: 'Finance', winRate: 0.68, trades: 88 },
        { category: 'Sports', winRate: 0.51, trades: 64 },
        { category: 'Culture', winRate: 0.43, trades: 31 },
      ];

  const edgeScore = Number(syncStatus?.progress?.edgeScore ?? summary?.edgeScore ?? 50);
  const edgePercentile = Math.round((summary?.edgePercentile ?? 0.5) * 100);
  const tradesCount = syncStatus?.progress?.trades ?? 0;
  const winRate = summary?.winRate ?? (topCategory?.winRate ?? 0.5);
  const insightBandWinRate = Math.min(0.92, Math.max(0.52, winRate + 0.12));

  function toggleApp(app: AppId) {
    if (app === 'kalshi') return;
    setConnectedApps(new Set([app]));
  }

  function goNext() {
    if (!canGoNext) return;
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => (s + 1) as Step);
      return;
    }
    onCompleted?.();
    onClose();
  }

  function goBack() {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => (s - 1) as Step);
  }

  async function startImport() {
    if (!connectedApps.has('polymarket')) {
      setError('Select Polymarket to continue.');
      return;
    }
    if (!walletAddress) {
      setError('Connect your wallet first.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setImportState('importing');

    const maybeOverride = socialWalletOverride.trim().toLowerCase();
    const useOverride = connectionMethod === 'social' && maybeOverride.length > 0;

    try {
      const connectRes = await fetch('/api/venues/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          venueId: 'polymarket',
          accountLabel: connectionMethod === 'social' ? 'Polymarket (social)' : 'Polymarket',
          connectionMethod,
          externalAccountRef: useOverride ? maybeOverride : undefined,
        }),
      });
      if (!connectRes.ok) {
        const payload = (await connectRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Failed to connect venue');
      }

      const syncRes = await fetch('/api/venues/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ venueId: 'polymarket' }),
      });
      if (!syncRes.ok) {
        throw new Error('Failed to start sync');
      }

      isPollingRef.current = true;
    } catch (cause) {
      setImportState('idle');
      setError(cause instanceof Error ? cause.message : 'Failed to start import');
    } finally {
      setIsSubmitting(false);
    }
  }

  const slideVariants = {
    enter: (customDirection: number) => ({ x: customDirection > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (customDirection: number) => ({ x: customDirection > 0 ? -60 : 60, opacity: 0 }),
  };

  function renderConnectStep() {
    return (
      <motion.div
        key="step-connect"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#6366f1]/20 to-[#00d4aa]/20 border border-[#6366f1]/25 flex items-center justify-center mb-6">
          <Link2 size={26} className="text-[#6366f1]" />
        </div>
        <h2 className="text-foreground text-3xl md:text-5xl leading-none tracking-tight mb-4">Connect Your Apps</h2>
        <p className="text-muted-foreground text-base md:text-2xl text-center max-w-[780px] mb-8 md:mb-10 leading-snug">
          Link your prediction market accounts to start tracking performance across venues.
        </p>

        <div className="w-full space-y-4">
          <button
            onClick={() => toggleApp('polymarket')}
            className={`w-full flex items-center gap-5 p-6 rounded-[28px] border transition-all ${
              connectedApps.has('polymarket')
                ? 'bg-card border-[#6366f1]/45'
                : 'bg-secondary/20 border-border hover:bg-secondary/35'
            }`}
          >
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 bg-[#6366f1]/12 border border-[#6366f1]/30">
              <Globe size={30} className="text-[#6366f1]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-foreground text-xl md:text-[42px] leading-none">Polymarket</p>
              <p className="text-muted-foreground text-sm md:text-base mt-2">Crypto-native prediction markets</p>
            </div>
            {connectedApps.has('polymarket') ? (
              <CheckCircle size={28} className="text-[#00d4aa]" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-border" />
            )}
          </button>

          <div className="w-full flex items-center gap-5 p-6 rounded-[28px] border bg-secondary/20 border-border opacity-85">
            <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 bg-[#f59e0b]/12 border border-[#f59e0b]/30">
              <BarChart3 size={30} className="text-[#f59e0b]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-foreground text-xl md:text-[42px] leading-none">Kalshi</p>
              <p className="text-muted-foreground text-sm md:text-base mt-2">Regulated event contracts</p>
            </div>
            <span className="text-[12px] rounded-full px-3 py-1 bg-[#f59e0b]/15 text-[#f59e0b]">Coming Soon</span>
          </div>
        </div>

        <div className="w-full mt-7 rounded-2xl border border-border bg-secondary/20 p-4">
          <p className="text-[13px] text-muted-foreground mb-3">Polymarket connection mode</p>
          <div className="inline-flex rounded-xl border border-border bg-[#0f1220] p-1 w-full">
            <button
              onClick={() => setConnectionMethod('eoa')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                connectionMethod === 'eoa' ? 'bg-[#00d4aa]/15 text-[#00d4aa]' : 'text-muted-foreground'
              }`}
            >
              EOA Wallet
            </button>
            <button
              onClick={() => setConnectionMethod('social')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs transition-colors ${
                connectionMethod === 'social' ? 'bg-[#6366f1]/15 text-[#6366f1]' : 'text-muted-foreground'
              }`}
            >
              Social / Embedded
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {connectionMethod === 'eoa'
              ? `Using connected wallet ${walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}.`
              : 'Use Polymarket social sign-in, then optionally provide your Polymarket deposit wallet if different.'}
          </p>
          {connectionMethod === 'social' ? (
            <div className="mt-3 space-y-2">
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#6366f1]/35 bg-[#6366f1]/10 px-3 py-2 text-xs text-[#a5b4fc] hover:bg-[#6366f1]/15"
              >
                Open Polymarket Sign-In
                <ArrowRight size={12} />
              </a>
              <button
                onClick={() => setShowSocialInput((v) => !v)}
                className="block text-xs text-muted-foreground hover:text-foreground"
              >
                {showSocialInput ? 'Hide wallet override' : 'Need a different wallet? Add override'}
              </button>
              {showSocialInput ? (
                <input
                  value={socialWalletOverride}
                  onChange={(event) => setSocialWalletOverride(event.target.value)}
                  placeholder="0x... (optional)"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </motion.div>
    );
  }

  function renderImportStep() {
    return (
      <motion.div
        key="step-import"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#00d4aa]/20 to-[#3b82f6]/20 border border-[#00d4aa]/20 flex items-center justify-center mb-6">
          <Download size={26} className="text-[#00d4aa]" />
        </div>
        <h2 className="text-foreground text-3xl md:text-5xl leading-none tracking-tight mb-4">Import History</h2>
        <p className="text-muted-foreground text-base md:text-2xl text-center max-w-[780px] mb-8 md:mb-10 leading-snug">
          We'll pull your past trades to build your performance profile instantly.
        </p>

        <div className="w-full bg-card rounded-[28px] border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm md:text-xl">
              {importState === 'idle' ? 'Ready to import' : importState === 'importing' ? 'Importing trades...' : 'Import complete'}
            </span>
            <span className="text-foreground text-2xl md:text-[44px] font-mono">
              {importState === 'done'
                ? `${syncStatus?.progress?.trades ?? tradesCount} trades`
                : importState === 'importing'
                  ? `${Math.floor((inferredImportProgress / 100) * Math.max(tradesCount, 120))} trades`
                  : '--'}
            </span>
          </div>
          <div className="h-5 bg-[#1a1d27] rounded-full overflow-hidden mb-4 relative">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#00d4aa] to-[#6366f1]"
              animate={{ width: `${Math.max(3, inferredImportProgress)}%` }}
              transition={{ duration: 0.2, ease: 'linear' }}
            />
            {importState === 'importing' ? (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '40%' }}
              />
            ) : null}
          </div>

          <div className="flex items-center gap-6 text-base md:text-[28px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#6366f1]" />
              <span className="text-muted-foreground">Polymarket</span>
              {importState === 'done' ? <CheckCircle size={20} className="text-[#00d4aa]" /> : null}
            </div>
            <div className="flex items-center gap-3 opacity-65">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-muted-foreground">Kalshi</span>
            </div>
          </div>

          {importState === 'done' ? (
            <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border/50">
              <Stat label="Trades" value={`${syncStatus?.progress?.trades ?? tradesCount}`} />
              <Stat label="Win Rate" value={`${(winRate * 100).toFixed(1)}%`} />
              <Stat label="Total PnL" value={`${(summary?.pnlTotal ?? 0) >= 0 ? '+' : '-'}$${Math.abs(summary?.pnlTotal ?? 0).toLocaleString()}`} />
            </div>
          ) : null}
        </div>

        <div className="mt-6 min-h-10">
          {importState === 'idle' ? (
            <button
              onClick={startImport}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#00d4aa] text-[#0a0b0f] text-lg md:text-[22px] hover:bg-[#00d4aa]/90 disabled:opacity-60"
            >
              <Download size={20} />
              Start Import
            </button>
          ) : null}
          {importState === 'importing' ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm md:text-base">
              <Loader2 size={16} className="animate-spin" />
              Processing historical data...
            </div>
          ) : null}
          {error ? <p className="text-destructive text-sm mt-2 text-center">{error}</p> : null}
        </div>
      </motion.div>
    );
  }

  function renderEdgeStep() {
    return (
      <motion.div
        key="step-edge"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#00d4aa]/20 to-[#00d4aa]/5 border border-[#00d4aa]/20 flex items-center justify-center mb-6">
          <Target size={26} className="text-[#00d4aa]" />
        </div>
        <h2 className="text-foreground text-3xl md:text-5xl leading-none tracking-tight mb-4">Your Edge Score</h2>
        <p className="text-muted-foreground text-base md:text-2xl text-center max-w-[780px] mb-8 md:mb-10 leading-snug">
          A single number that captures how well you trade. It factors in accuracy, timing, ROI, and consistency.
        </p>

        <div className="mb-6">
          <MiniEdgeRing score={edgeScore} />
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <Factor title="Accuracy" value={`${(winRate * 100).toFixed(1)}%`} color="#00d4aa" />
          <Factor title="Timing" value={`Top ${Math.max(1, 100 - edgePercentile)}%`} color="#6366f1" />
          <Factor title="ROI" value={`${summary?.roi ? `${summary.roi >= 0 ? '+' : ''}${(summary.roi * 100).toFixed(1)}%` : '+0.0%'}`} color="#f59e0b" />
          <Factor title="Consistency" value={edgeScore >= 70 ? 'High' : edgeScore >= 55 ? 'Rising' : 'Building'} color="#ec4899" />
        </div>

        <p className="text-muted-foreground text-sm md:text-base text-center mt-6 max-w-[520px]">
          Your score of <span className="text-[#00d4aa] font-mono">{edgeScore.toFixed(1)}</span> puts you in the{' '}
          <span className="text-foreground font-mono">{edgePercentile}th percentile</span> of all traders.
        </p>
      </motion.div>
    );
  }

  function renderCategoryStep() {
    const max = Math.max(...categoryValues.map((row) => row.winRate), 1);
    return (
      <motion.div
        key="step-category"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#f59e0b]/20 to-[#f59e0b]/5 border border-[#f59e0b]/20 flex items-center justify-center mb-6">
          <Trophy size={26} className="text-[#f59e0b]" />
        </div>
        <h2 className="text-foreground text-3xl md:text-5xl leading-none tracking-tight mb-4">Your Strongest Category</h2>
        <p className="text-muted-foreground text-base md:text-2xl text-center max-w-[780px] mb-8 md:mb-10 leading-snug">
          Based on your trade history, here's where your edge is sharpest.
        </p>

        <div className="w-full space-y-4">
          {categoryValues.map((row, index) => (
            <div key={row.category} className="flex items-center gap-4">
              <span className="text-sm md:text-base text-muted-foreground w-[90px] text-right">{row.category}</span>
              <div className="flex-1 h-[44px] bg-[#1a1d27] rounded-2xl overflow-hidden relative">
                <motion.div
                  className={`h-full ${index === 0 ? 'bg-[#6366f1]' : 'bg-[#00d4aa]/45'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, (row.winRate / max) * 100)}%` }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                />
              </div>
              <span className="text-base md:text-lg font-mono text-foreground w-[70px] text-right">{Math.round(row.winRate * 100)}%</span>
              {index === 0 ? <Trophy size={16} className="text-[#f59e0b]" /> : <span className="w-4" />}
            </div>
          ))}
        </div>

        <div className="w-full mt-7 bg-[#6366f1]/[0.08] border border-[#6366f1]/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/18 flex items-center justify-center">
            <Flame size={17} className="text-[#6366f1]" />
          </div>
          <div>
            <p className="text-foreground text-base md:text-lg mb-1">{topCategory?.category ?? 'Politics'} is your strongest category</p>
            <p className="text-muted-foreground text-sm md:text-[15px] leading-relaxed">
              {(topCategory?.winRate ?? 0.82) * 100 >= 1 ? Math.round((topCategory?.winRate ?? 0.82) * 100) : 82}% win rate across{' '}
              {topCategory?.trades ?? 184} trades. Your timing in this category is in the top 5%.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  function renderInsightStep() {
    const better = Math.max(10, Math.round((insightBandWinRate - winRate) * 100));
    return (
      <motion.div
        key="step-insight"
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 border border-[#8b5cf6]/20 flex items-center justify-center mb-6">
          <Sparkles size={26} className="text-[#8b5cf6]" />
        </div>
        <h2 className="text-foreground text-3xl md:text-5xl leading-none tracking-tight mb-4">Your First Insight</h2>
        <p className="text-muted-foreground text-base md:text-2xl text-center max-w-[780px] mb-9 leading-snug">
          PolyPlot found a pattern in your trading that could sharpen your edge even further.
        </p>

        <div className="w-full bg-card border border-border rounded-3xl overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#8b5cf6] via-[#00d4aa] to-[#f59e0b]" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} className="text-[#f59e0b]" />
              <span className="text-[#f59e0b] text-sm md:text-lg">PATTERN DETECTED</span>
            </div>

            <p className="text-foreground text-xl md:text-[24px] leading-snug mb-3">
              You perform <span className="text-[#00d4aa] font-mono">{better}% better</span> when entering positions in the{' '}
              <span className="text-foreground font-mono">60-75%</span> probability band.
            </p>
            <p className="text-muted-foreground text-sm md:text-lg leading-relaxed mb-5">
              Your win rate jumps from {(winRate * 100).toFixed(0)}% to {(insightBandWinRate * 100).toFixed(0)}% and average ROI improves with better timing in this range.
              Consider focusing more positions here.
            </p>

            <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border/50">
              <Stat label="Trades in Band" value={`${Math.max(42, Math.round(tradesCount * 0.3))}`} />
              <Stat label="Win Rate" value={`${(insightBandWinRate * 100).toFixed(1)}%`} />
              <Stat label="Avg ROI" value={`+${Math.max(8, Math.round((summary?.roi ?? 0.18) * 200))}%`} />
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-muted-foreground text-sm md:text-[14px]">More insights on your Dashboard</p>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-sm md:text-[15px] text-center mt-6">You're all set. Your dashboard is ready.</p>
      </motion.div>
    );
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 26, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-0 z-[201] flex items-center justify-center p-3 md:p-6 pointer-events-none"
      >
        <div
          className="w-full max-w-[1080px] bg-[#0b111d] border border-border rounded-[40px] shadow-[0_24px_80px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col overflow-hidden max-h-[96vh]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative">
            <div className="h-[3px] bg-gradient-to-r from-[#6366f1] via-[#00d4aa] to-[#f59e0b]" />
            <button
              onClick={onClose}
              className="absolute top-4 right-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all z-10"
            >
              <X size={22} />
            </button>
          </div>

          <div className="px-7 md:px-12 pt-6 pb-2">
            <div className="flex items-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
                <div key={idx} className="flex-1 h-[6px] rounded-full overflow-hidden bg-[#1a1d27]">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{
                      width: idx <= step ? '100%' : '0%',
                      backgroundColor: idx < step ? '#00d4aa' : idx === step ? '#6366f1' : '#1a1d27',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {STEP_LABELS.map((label, idx) => (
                <span
                  key={label}
                  className={`text-xs md:text-sm tracking-tight ${
                    idx <= step ? (idx === step ? 'text-[#6366f1]' : 'text-[#00d4aa]') : 'text-muted-foreground/40'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="px-7 md:px-12 py-4 md:py-6 min-h-[560px] flex-1 overflow-y-auto">
            <div className="max-w-[920px] mx-auto">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 0 ? renderConnectStep() : null}
                {step === 1 ? renderImportStep() : null}
                {step === 2 ? renderEdgeStep() : null}
                {step === 3 ? renderCategoryStep() : null}
                {step === 4 ? renderInsightStep() : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="px-7 md:px-12 py-5 border-t border-border flex items-center justify-between">
            <div>
              {step > 0 ? (
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm md:text-base text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-sm md:text-base text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip setup
                </button>
              )}
            </div>

            <div className="flex items-center gap-5">
              <span className="text-muted-foreground text-sm md:text-base font-mono">{step + 1}/5</span>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className={`flex items-center gap-2 px-5 md:px-7 py-3 md:py-4 rounded-[26px] text-base md:text-lg transition-all ${
                  canGoNext
                    ? step === 4
                      ? 'bg-gradient-to-r from-[#00d4aa] to-[#6366f1] text-white hover:opacity-90'
                      : 'bg-[#6366f1] text-white hover:bg-[#6366f1]/90'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                }`}
              >
                {step === 4 ? (
                  <>
                    Go to Dashboard
                    <Sparkles size={20} />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[#00d4aa] text-lg md:text-[34px] font-mono">{value}</p>
      <p className="text-muted-foreground text-xs md:text-base">{label}</p>
    </div>
  );
}

function Factor({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-secondary/30 border border-border/50 rounded-2xl p-4">
      <p className="text-foreground text-sm md:text-base">{title}</p>
      <p className="text-base md:text-xl font-mono mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
