import { GatedContent } from '@/components/layout/GatedContent';
import { PrivateProfile } from '@/components/profile/PrivateProfile';

export const metadata = {
  title: 'Profile',
};

export default function ProfilePage() {
  return (
    <GatedContent>
      <PrivateProfile />
    </GatedContent>
  );
}
