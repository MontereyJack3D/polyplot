'use client';

import { ArrowLeftRight, ArrowUpRight, ExternalLink, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { useWalletSummary } from '@/lib/hooks/use-wallet';

import { SlidePanel } from './SlidePanel';

interface WalletPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletPanel({ isOpen, onClose }: WalletPanelProps) {
  const wallet = useWalletSummary();
  const data = wallet.data;

  function handleOpenVenue(venueId: string) {
    const urls: Record<string, string> = {
      polymarket: 'https://polymarket.com',
      kalshi: 'https://kalshi.com',
    };
    window.open(urls[venueId] || 'https://polymarket.com', '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <SlidePanel isOpen={isOpen} onClose={onClose} title="Wallet" subtitle="Portfolio balances" icon={<Wallet size={16} />} width="md">
        {wallet.isLoading ? <p className="text-sm text-muted-foreground">Loading wallet...</p> : null}
        {wallet.isError ? <p className="text-sm text-destructive">Failed to load wallet data.</p> : null}

        {data ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs text-muted-foreground">Total Portfolio Value</p>
              <p className="font-mono text-3xl mt-1">${data.totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p className={['mt-1 text-sm font-mono', data.pnl24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
                {data.pnl24h >= 0 ? '+' : '-'}${Math.abs(data.pnl24h).toFixed(2)} (24h)
              </p>
            </div>

            <div className="space-y-3">
              {data.venues.map((venue) => {
                const usedPct = venue.total > 0 ? (venue.used / venue.total) * 100 : 0;
                const color = venue.venue === 'polymarket' ? '#00d4aa' : '#00b389';
                return (
                  <div key={venue.venue} className="rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{venue.venue}</p>
                      <p className="font-mono">${venue.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.max(3, Math.min(100, usedPct))}%`, backgroundColor: color }} />
                    </div>
                    <div className="mt-2 grid grid-cols-3 text-xs text-muted-foreground">
                      <span>Used ${venue.used.toFixed(2)}</span>
                      <span>Available ${venue.available.toFixed(2)}</span>
                      <span className={venue.pnl24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>{venue.pnl24h >= 0 ? '+' : '-'}${Math.abs(venue.pnl24h).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleOpenVenue(data.venues[0]?.venue ?? 'polymarket')}
                className="rounded-lg bg-primary text-primary-foreground py-2.5 text-xs font-medium inline-flex items-center justify-center gap-1"
              >
                <ArrowUpRight size={12} /> Deposit
              </button>
              <button
                onClick={() => handleOpenVenue(data.venues[0]?.venue ?? 'polymarket')}
                className="rounded-lg border border-border bg-secondary py-2.5 text-xs inline-flex items-center justify-center gap-1"
              >
                Withdraw <ExternalLink size={12} />
              </button>
              <button
                onClick={() => toast.info('Transfer is coming soon in Phase 2.')}
                className="rounded-lg border border-border bg-secondary py-2.5 text-xs inline-flex items-center justify-center gap-1"
              >
                <ArrowLeftRight size={12} /> Transfer
              </button>
            </div>
          </div>
        ) : null}
      </SlidePanel>
    </>
  );
}
