import { History } from '@/components/history/History';
import { GatedContent } from '@/components/layout/GatedContent';

export const metadata = {
  title: 'History',
};

export default function HistoryPage() {
  return (
    <GatedContent>
      <History />
    </GatedContent>
  );
}
