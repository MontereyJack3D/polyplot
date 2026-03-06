'use client';

import { Lock } from 'lucide-react';

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
  recentlyUnlocked?: boolean;
};

const TIER_COLORS: Record<string, { border: string; glow: string; text: string }> = {
  bronze: { border: 'border-amber-700/40', glow: 'shadow-[0_0_24px_rgba(217,119,6,0.25)]', text: 'text-amber-400' },
  silver: { border: 'border-slate-300/40', glow: 'shadow-[0_0_24px_rgba(148,163,184,0.22)]', text: 'text-slate-300' },
  gold: { border: 'border-yellow-500/40', glow: 'shadow-[0_0_24px_rgba(234,179,8,0.28)]', text: 'text-yellow-400' },
  diamond: { border: 'border-cyan-400/40', glow: 'shadow-[0_0_24px_rgba(34,211,238,0.30)]', text: 'text-cyan-300' },
};

export function AchievementBadge({
  achievement,
  onClick,
}: {
  achievement: AchievementItem;
  onClick?: () => void;
}) {
  const unlocked = !!achievement.unlockedAt;
  const hiddenLocked = achievement.isHidden && !unlocked;
  const tier = TIER_COLORS[achievement.tier] ?? TIER_COLORS.bronze;

  if (hiddenLocked) {
    return (
      <button onClick={onClick} className="rounded-xl border border-border bg-secondary/40 p-3 text-center w-full">
        <Lock size={14} className="mx-auto text-muted-foreground" />
        <p className="text-xs mt-2 text-muted-foreground">???</p>
      </button>
    );
  }

  const progress = achievement.target
    ? Math.min(100, ((achievement.progress ?? 0) / Math.max(achievement.target, 1)) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className={[
        'rounded-xl border p-3 w-full text-left transition-all',
        unlocked ? `${tier.border} bg-secondary/40 ${tier.glow}` : 'border-border bg-secondary/30',
        achievement.recentlyUnlocked ? 'animate-pulse' : '',
      ].join(' ')}
    >
      <p className="text-[11px] text-muted-foreground uppercase">{achievement.family}</p>
      <p className="mt-1 text-sm font-medium leading-snug">{achievement.name}</p>
      <p className={['mt-1 text-[11px] capitalize', unlocked ? tier.text : 'text-muted-foreground'].join(' ')}>
        {achievement.tier}
      </p>

      {!unlocked && achievement.target !== undefined ? (
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
    </button>
  );
}

export function CompactBadge({
  achievement,
  onClick,
}: {
  achievement: AchievementItem;
  onClick?: () => void;
}) {
  const unlocked = !!achievement.unlockedAt;
  const tier = TIER_COLORS[achievement.tier] ?? TIER_COLORS.bronze;

  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-full text-[11px] border inline-flex items-center gap-1',
        unlocked ? `${tier.border} ${tier.text} bg-secondary/50` : 'border-border text-muted-foreground bg-secondary/30',
      ].join(' ')}
    >
      <span>{achievement.name}</span>
    </button>
  );
}
