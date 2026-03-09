import { GatedContent } from '@/components/layout/GatedContent';
import { SettingsPage } from '@/components/settings/SettingsPage';

export const metadata = {
  title: 'Settings',
};

export default function SettingsRoutePage() {
  return (
    <GatedContent>
      <SettingsPage />
    </GatedContent>
  );
}
