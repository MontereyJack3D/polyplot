import { AppShell } from '@/components/layout/AppShell';
import { Web3Provider } from '@/lib/providers/Web3Provider';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <AppShell>{children}</AppShell>
    </Web3Provider>
  );
}
