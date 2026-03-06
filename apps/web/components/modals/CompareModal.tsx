'use client';

import { GitCompareArrows } from 'lucide-react';

import { SlidePanel } from '@/components/panels/SlidePanel';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseHandle: string;
  edgeScore: number;
}

export function CompareModal({ isOpen, onClose, baseHandle, edgeScore }: CompareModalProps) {
  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Profiles"
      subtitle="Head-to-head edge comparison"
      icon={<GitCompareArrows size={16} />}
      width="sm"
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <p className="text-muted-foreground text-xs">You</p>
          <p className="font-medium">@{baseHandle}</p>
          <p className="font-mono text-primary mt-1">Edge {edgeScore.toFixed(1)}</p>
        </div>

        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <label htmlFor="compare-handle" className="text-xs text-muted-foreground block mb-1.5">
            Compare with handle
          </label>
          <input
            id="compare-handle"
            placeholder="@marketoracle"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button className="mt-2 w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium">Compare</button>
        </div>
      </div>
    </SlidePanel>
  );
}
