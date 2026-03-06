'use client';

import { ExternalLink } from 'lucide-react';

import { SlidePanel } from '@/components/panels/SlidePanel';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="Deposit" subtitle="Choose a venue" width="sm">
      <div className="space-y-2">
        <a href="https://polymarket.com" target="_blank" rel="noreferrer" className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm inline-flex items-center justify-between">
          Deposit on Polymarket <ExternalLink size={14} />
        </a>
        <a href="https://kalshi.com" target="_blank" rel="noreferrer" className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm inline-flex items-center justify-between">
          Deposit on Kalshi <ExternalLink size={14} />
        </a>
      </div>
    </SlidePanel>
  );
}
