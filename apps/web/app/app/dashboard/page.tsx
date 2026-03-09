import { Dashboard } from '@/components/dashboard/Dashboard';
import { GatedContent } from '@/components/layout/GatedContent';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <GatedContent>
      <Dashboard />
    </GatedContent>
  );
}
