'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LogOut, PlugZap, Wallet2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useDisconnect } from 'wagmi';

export function PolyPlotConnectButton({ compact = false }: { compact?: boolean }) {
  const { disconnect } = useDisconnect();

  const handleOpenOnboarding = () => {
    window.dispatchEvent(new CustomEvent('polyplot:open-onboarding'));
  };

  const handleLogout = async () => {
    disconnect();
    await signOut({ callbackUrl: '/app/leaderboard' });
  };

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const connected = mounted && !!account && !!chain;

        return (
          <div
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
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2.5 bg-secondary hover:bg-accent border border-border rounded-lg px-3 py-2 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#6366f1]" />
                    <span className="text-foreground text-[13px] font-mono">{account.displayName}</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-[220px] rounded-lg border border-border bg-card p-1.5 shadow-xl"
                  >
                    <DropdownMenu.Item
                      onSelect={handleOpenOnboarding}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none cursor-pointer hover:bg-secondary"
                    >
                      <PlugZap size={14} className="text-primary" />
                      Connect Prediction Markets
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={openAccountModal}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none cursor-pointer hover:bg-secondary"
                    >
                      <Wallet2 size={14} className="text-primary" />
                      Wallet Details
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none cursor-pointer hover:bg-secondary"
                    >
                      <LogOut size={14} className="text-muted-foreground" />
                      Log out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
