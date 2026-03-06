'use client';

import { Award } from 'lucide-react';

import { SlidePanel } from '@/components/panels/SlidePanel';

type AchievementItem = {
  name: string;
  family: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | string;
  iconRef?: string | null;
  description?: string;
  requirement?: string;
  progress?: number;
  target?: number;
  unlockedAt?: string | null;
  isHidden?: boolean;
};

const XP_BY_TIER: Record<string, number> = {
  bronze: 50,
  silver: 100,
  gold: 200,
  diamond: 400,
};

const TIER_CLASS: Record<string, string> = {
  bronze: 'from-amber-700/30 to-amber-500/10 border-amber-600/40',
  silver: 'from-slate-400/30 to-slate-200/10 border-slate-300/40',
  gold: 'from-yellow-500/30 to-yellow-300/10 border-yellow-400/40',
  diamond: 'from-cyan-500/30 to-violet-500/10 border-cyan-400/40',
};

export function AchievementDetailModal({
  achievement,
  isOpen,
  onClose,
}: {
  achievement: AchievementItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title={achievement?.name ?? 'Achievement'} subtitle="Achievement details" icon={<Award size={16} />} width="md">
      {!achievement ? <p className="text-sm text-muted-foreground">No achievement selected.</p> : null}
      {achievement ? (
        <div className="space-y-4">
          <div className={['rounded-xl border bg-gradient-to-br p-5 text-center', TIER_CLASS[achievement.tier] ?? 'from-secondary to-secondary/30 border-border'].join(' ')}>
            <div className="w-14 h-14 rounded-xl bg-black/20 border border-white/10 mx-auto flex items-center justify-center">
              <Award size={24} className="text-primary" />
            </div>
            <h3 className="mt-3 text-lg">{achievement.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {achievement.family} · {achievement.tier}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">{achievement.description ?? 'Complete this milestone to unlock.'}</p>
            <p className="text-xs text-muted-foreground mt-2">Requirement</p>
            <p className="text-sm">{achievement.requirement ?? 'Meet the criteria for this badge.'}</p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>
                {achievement.progress ?? 0} / {achievement.target ?? 1}
              </span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, ((achievement.progress ?? 0) / Math.max(1, achievement.target ?? 1)) * 100)}%` }}
              />
            </div>
            {achievement.unlockedAt ? (
              <p className="text-xs text-[#22c55e] mt-2">Unlocked {new Date(achievement.unlockedAt).toLocaleString()}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">XP Value</span>
            <span className="font-mono text-sm">{XP_BY_TIER[achievement.tier] ?? 25} XP</span>
          </div>
        </div>
      ) : null}
    </SlidePanel>
  );
}
