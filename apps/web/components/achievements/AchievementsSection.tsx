'use client';

import { useMemo, useState } from 'react';

import { AchievementBadge } from './AchievementBadge';
import { AchievementDetailModal } from './AchievementDetailModal';

type AchievementItem = {
  name: string;
  family: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | string;
  iconRef?: string | null;
  unlockedAt?: string | null;
  progress?: number;
  target?: number;
  isHidden?: boolean;
  description?: string;
  requirement?: string;
};

const FAMILY_LABELS: Record<string, string> = {
  skill: 'Skill',
  streak: 'Streak',
  profit: 'Profit',
  specialization: 'Specialization',
  longevity: 'Longevity',
  competitive: 'Competitive',
};

export function AchievementsSection({ achievements }: { achievements: AchievementItem[] }) {
  const [activeFamily, setActiveFamily] = useState<'all' | string>('all');
  const [selected, setSelected] = useState<AchievementItem | null>(null);

  const families = useMemo(() => {
    const values = Array.from(new Set(achievements.map((a) => a.family).filter(Boolean)));
    return ['all', ...values];
  }, [achievements]);

  const filtered = useMemo(() => {
    if (activeFamily === 'all') return achievements;
    return achievements.filter((a) => a.family === activeFamily);
  }, [achievements, activeFamily]);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {families.map((family) => (
          <button
            key={family}
            onClick={() => setActiveFamily(family)}
            className={[
              'px-2.5 py-1 rounded-full border text-xs',
              activeFamily === family ? 'border-primary/50 text-primary bg-primary/10' : 'border-border text-muted-foreground bg-secondary/30',
            ].join(' ')}
          >
            {family === 'all' ? 'All' : FAMILY_LABELS[family] ?? family}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {filtered.map((achievement, idx) => (
          <AchievementBadge key={`${achievement.name}-${idx}`} achievement={achievement} onClick={() => setSelected(achievement)} />
        ))}
      </div>

      <AchievementDetailModal achievement={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
