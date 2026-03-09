'use client';

import dynamic from 'next/dynamic';

const Web3ProviderDynamic = dynamic(
  () => import('./Web3ProviderInner').then((module) => module.Web3ProviderInner),
  {
    ssr: false,
    loading: () => null,
  }
);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <Web3ProviderDynamic>{children}</Web3ProviderDynamic>;
}
