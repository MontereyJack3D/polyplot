'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

import { AchievementUnlockListener } from '@/components/achievements/AchievementUnlockListener';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { NotificationPanel, type NotificationItem } from '@/components/panels/NotificationPanel';
import { WalletPanel } from '@/components/panels/WalletPanel';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useNFTGate } from '@/lib/hooks/use-nft-gate';
import { useVenueAccounts } from '@/lib/hooks/use-venue-accounts';
import { useWalletSummary } from '@/lib/hooks/use-wallet';

import { CommandPalette } from './CommandPalette';
import { GlobalFilterBar } from './GlobalFilterBar';
import { Header } from './Header';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { Sidebar } from './Sidebar';

async function loadNotifications(): Promise<NotificationItem[]> {
  const now = Date.now();
  return [
    {
      id: 'n1',
      title: 'Market Resolved',
      body: 'A tracked market resolved and your decision set was updated.',
      ts: new Date(now - 5 * 60_000).toISOString(),
      unread: true,
      type: 'resolution',
    },
    {
      id: 'n2',
      title: 'Edge Milestone',
      body: 'Your Edge Score crossed a new personal threshold.',
      ts: new Date(now - 60 * 60_000).toISOString(),
      unread: true,
      type: 'milestone',
    },
    {
      id: 'n3',
      title: 'Achievement Progress',
      body: 'You moved closer to unlocking a streak achievement.',
      ts: new Date(now - 3 * 60 * 60_000).toISOString(),
      unread: false,
      type: 'achievement',
    },
  ];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { hasAccess } = useNFTGate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingForcedOpen, setOnboardingForcedOpen] = useState(false);

  const walletSummary = useWalletSummary();

  useEffect(() => {
    if (status === 'authenticated' && hasAccess) {
      fetch('/api/users/ensure', { method: 'POST' }).catch(() => undefined);
    }
  }, [hasAccess, status]);

  const venueAccounts = useVenueAccounts();

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const items = await loadNotifications();
      if (active) setNotifications(items);
    };

    refresh();
    const interval = setInterval(refresh, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const closeAll = () => {
      setNotificationsOpen(false);
      setWalletOpen(false);
      setMobileSidebarOpen(false);
    };

    window.addEventListener('polyplot:close-panels', closeAll);
    return () => window.removeEventListener('polyplot:close-panels', closeAll);
  }, []);

  useEffect(() => {
    const openOnboarding = () => {
      setOnboardingDismissed(false);
      setOnboardingForcedOpen(true);
    };
    window.addEventListener('polyplot:open-onboarding', openOnboarding);
    return () => window.removeEventListener('polyplot:open-onboarding', openOnboarding);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);
  const shouldAutoShowOnboarding =
    status === 'authenticated' &&
    hasAccess &&
    !onboardingDismissed &&
    !venueAccounts.isLoading &&
    !venueAccounts.isError &&
    !venueAccounts.hasConnectedVenue;
  const showOnboarding = onboardingForcedOpen || shouldAutoShowOnboarding;

  return (
    <>
      <div className="min-h-screen bg-background text-foreground flex">
        <KeyboardShortcuts />
        <CommandPalette />
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onToggle={() => setCollapsed((v) => !v)}
        />

        <div className="min-w-0 flex-1 flex flex-col">
          <Header
            edgeScore={62.4}
            pnl24h={walletSummary.data?.pnl24h ?? 0}
            walletTotal={walletSummary.data?.totalBalance ?? 0}
            unreadCount={unreadCount}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenWallet={() => setWalletOpen(true)}
            onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
          />
          <GlobalFilterBar />
          <AchievementUnlockListener />
          <main className="flex-1 p-3 md:p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
        </div>
      </div>

      <NotificationPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
      />

      <WalletPanel isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setOnboardingDismissed(true);
          setOnboardingForcedOpen(false);
        }}
        onCompleted={() => {
          venueAccounts.refetch();
          walletSummary.refetch();
          setOnboardingForcedOpen(false);
          setOnboardingDismissed(true);
        }}
      />
    </>
  );
}
