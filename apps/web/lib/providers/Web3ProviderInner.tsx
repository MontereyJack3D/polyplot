'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { darkTheme, getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import { mainnet, polygon } from 'wagmi/chains';
import { WagmiProvider } from 'wagmi';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'polyplot';

const config = getDefaultConfig({
  appName: 'PolyPlot',
  projectId: walletConnectProjectId,
  chains: [mainnet, polygon],
  ssr: false,
  // Important for desktop UX: discover injected wallets (Rabby, MetaMask, etc.).
  multiInjectedProviderDiscovery: true,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        rabbyWallet,
        metaMaskWallet,
        injectedWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [rainbowWallet, walletConnectWallet],
    },
  ],
});

const polyplotTheme = darkTheme({
  accentColor: '#00D4AA',
  accentColorForeground: '#0A0B0F',
  borderRadius: 'medium',
  fontStack: 'system',
});

polyplotTheme.colors.modalBackground = '#12141A';
polyplotTheme.colors.modalBorder = 'rgba(255, 255, 255, 0.08)';
polyplotTheme.colors.profileForeground = '#1A1D27';
polyplotTheme.colors.closeButtonBackground = '#1A1D27';

const getSiweMessageOptions = () => ({
  statement: 'Sign in to PolyPlot — The Forecasting Arena',
});

export function Web3ProviderInner({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <RainbowKitSiweNextAuthProvider getSiweMessageOptions={getSiweMessageOptions}>
            <RainbowKitProvider theme={polyplotTheme} modalSize="compact">
              {children}
            </RainbowKitProvider>
          </RainbowKitSiweNextAuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}
