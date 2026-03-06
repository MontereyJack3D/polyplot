'use client';

import { Lock } from 'lucide-react';

export interface AchievementCard {
  name: string;
  family: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | string;
  unlockedAt?: string | null;
  progress?: number;
  target?: number;
  iconRef?: string | null;
  hidden?: boolean;
}

function tierClass(tier: string): string {
  if (tier === 'diamond') return 'border-[#60a5fa]/40 bg-[#60a5fa]/10';
  if (tier === 'gold') return 'border-[#f59e0b]/40 bg-[#f59e0b]/10';
  if (tier === 'silver') return 'border-[#94a3b8]/40 bg-[#94a3b8]/10';
  return 'border-[#cd7f32]/40 bg-[#cd7f32]/10';
}

export function AchievementBadge({ achievement }: { achievement: AchievementCard }) {
  const isUnlocked = !!achievement.unlockedAt;
  const isHidden = achievement.hidden;

  if (isHidden && !isUnlocked) {
    return (
      <div className="rounded-xl border border-border bg-secondary/40 p-3 text-center">
        <Lock size={14} className="mx-auto text-muted-foreground" />
        <p className="text-xs mt-2 text-muted-foreground">???</p>
      </div>
    );
  }

  const progress = achievement.target ? Math.min(100, ((achievement.progress || 0) / achievement.target) * 100) : 0;

  return (
    <div className={['rounded-xl border p-3', isUnlocked ? tierClass(achievement.tier) : 'border-border bg-secondary/40'].join(' ')}>
      <p className="text-xs text-muted-foreground uppercase">{achievement.family}</p>
      <p className="mt-1 text-sm font-medium">{achievement.name}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Tier: {achievement.tier}</p>

      {!isUnlocked && achievement.target !== undefined ? (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {achievement.progress ?? 0} / {achievement.target}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[#22c55e]">Unlocked</p>
      )}
    </div>
  );
}
