'use client';

import { Bell, Menu, Wallet } from 'lucide-react';

interface HeaderProps {
  edgeScore: number;
  pnl24h: number;
  walletTotal: number;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenWallet: () => void;
  onToggleSidebar?: () => void;
}

function formatCurrency(value: number): string {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function Header({
  edgeScore,
  pnl24h,
  walletTotal,
  unreadCount,
  onOpenNotifications,
  onOpenWallet,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-background px-5 flex items-center justify-between">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {onToggleSidebar ? (
          <button
            onClick={onToggleSidebar}
            className="md:hidden rounded-lg border border-border bg-secondary/60 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Open menu"
          >
            <Menu size={16} />
          </button>
        ) : null}
        <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
        <span>Live</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground mr-2">Edge Score</span>
          <span className="font-mono text-[#00d4aa] font-medium">{edgeScore.toFixed(1)}</span>
        </div>

        <div className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground mr-2">24h PnL</span>
          <span className={['font-mono font-medium', pnl24h >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'].join(' ')}>
            {formatCurrency(pnl24h)}
          </span>
        </div>

        <button
          onClick={onOpenNotifications}
          className="relative rounded-lg border border-border bg-secondary/60 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Open notifications"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenWallet}
          className="rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors inline-flex items-center gap-2"
        >
          <Wallet size={14} className="text-primary" />
          <span className="font-mono">${walletTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </button>
      </div>
    </header>
  );
}
