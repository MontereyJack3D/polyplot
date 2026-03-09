'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LogOut, PlugZap, Wallet2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { useDisconnect } from 'wagmi';

export function PolyPlotConnectButton({ compact = false }: { compact?: boolean }) {
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleOpenOnboarding = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('polyplot:open-onboarding'));
  };

  const handleLogout = async () => {
    setOpen(false);
    disconnect();
    await signOut({ callbackUrl: '/app/leaderboard' });
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const connected = mounted && !!account && !!chain;

        return (
          <div
            ref={menuRef}
            className="relative"
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="flex items-center gap-2 bg-gradient-to-r from-[#00d4aa] to-[#6366f1] text-white font-medium rounded-lg px-4 py-2 text-sm hover:opacity-90 transition-opacity"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                  <circle cx="18" cy="16" r="2" />
                </svg>
                {compact ? 'Connect' : 'Connect Wallet'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setOpen((value) => !value)}
                  className="flex items-center gap-2.5 bg-secondary hover:bg-accent border border-border rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#6366f1]" />
                  <span className="text-foreground text-[13px] font-mono leading-none">{account.displayName}</span>
                </button>

                {open ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[120] min-w-[250px] rounded-xl border border-border bg-[#12141a] p-1.5 shadow-2xl">
                    <button
                      onClick={handleOpenOnboarding}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-secondary text-left"
                    >
                      <PlugZap size={14} className="text-primary" />
                      <span className="whitespace-nowrap">Connect Prediction Markets</span>
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        openAccountModal();
                      }}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-secondary text-left"
                    >
                      <Wallet2 size={14} className="text-primary" />
                      <span className="whitespace-nowrap">Wallet Details</span>
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-secondary text-left"
                    >
                      <LogOut size={14} className="text-muted-foreground" />
                      <span className="whitespace-nowrap">Log out</span>
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
