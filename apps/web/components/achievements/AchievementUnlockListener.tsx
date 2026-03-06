'use client';

import { useEffect, useRef } from 'react';

import { useAchievements } from '@/lib/hooks/use-profile';

import { showAchievementToast } from './AchievementToast';

export function AchievementUnlockListener() {
  const { data } = useAchievements();
  const prevRef = useRef<{ unlocked?: Array<{ name: string; tier: string; family?: string }> } | null>(null);

  useEffect(() => {
    const current = (data as { unlocked?: Array<{ name: string; tier: string; family?: string }> } | undefined) ?? {};
    const previous = prevRef.current;

    if (previous?.unlocked && current.unlocked) {
      const newUnlocks = current.unlocked.filter(
        (achievement) => !previous.unlocked?.find((item) => item.name === achievement.name)
      );
      newUnlocks.forEach((achievement) => {
        showAchievementToast({
          name: achievement.name,
          tier: achievement.tier,
          family: achievement.family,
        });
      });
    }

    prevRef.current = current;
  }, [data]);

  return null;
}
