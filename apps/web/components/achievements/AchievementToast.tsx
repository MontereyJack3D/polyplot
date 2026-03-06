'use client';

import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type ToastAchievement = {
  name: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | string;
  family?: string;
  iconRef?: string | null;
};

const tierClass: Record<string, string> = {
  bronze: 'text-amber-400',
  silver: 'text-slate-300',
  gold: 'text-yellow-400',
  diamond: 'text-cyan-400',
};

export function showAchievementToast(achievement: ToastAchievement, onView?: () => void) {
  toast.custom(
    (id) => (
      <div className="w-[360px] rounded-xl border border-primary/40 bg-card p-3 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-primary">Achievement Unlocked</p>
            <p className="text-sm mt-0.5">{achievement.name}</p>
            <p className={['text-[11px] mt-1 capitalize', tierClass[achievement.tier] ?? 'text-muted-foreground'].join(' ')}>
              {achievement.tier} · {achievement.family ?? 'achievement'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              toast.dismiss(id);
              onView?.();
            }}
            className="text-xs text-primary hover:underline"
          >
            View
          </button>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}
