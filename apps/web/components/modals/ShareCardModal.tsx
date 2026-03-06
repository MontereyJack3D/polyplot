'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Activity, Copy, Download, Share2 } from 'lucide-react';

import { SlidePanel } from '@/components/panels/SlidePanel';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    displayName: string | null;
    handle: string;
    edgeScore: number;
    winRate: number;
    totalTrades: number;
    strongestCategory: string | null;
  };
}

export function ShareCardModal({ isOpen, onClose, profile }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function downloadCard() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `polyplot-${profile.handle}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`https://polyplot.io/${profile.handle}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Share Profile"
      subtitle="Export your profile card"
      icon={<Share2 size={16} />}
      width="md"
    >
      <div className="space-y-4">
        <div ref={cardRef} className="rounded-2xl overflow-hidden border border-border" style={{ background: '#0A0B0F' }}>
          <div className="h-[3px] bg-gradient-to-r from-[#00d4aa] to-[#6366f1]" />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center text-white text-xs">
                {(profile.displayName || profile.handle).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm">{profile.displayName || profile.handle}</p>
                <p className="text-[#9ca3af] text-xs">@{profile.handle}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[#9ca3af] text-xs">Edge Score</p>
              <p className="text-[#00d4aa] text-4xl font-mono mt-1">{profile.edgeScore.toFixed(1)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <p className="text-[#9ca3af] text-[10px] uppercase">Win Rate</p>
                <p className="text-white font-mono">{(profile.winRate * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[#9ca3af] text-[10px] uppercase">Trades</p>
                <p className="text-white font-mono">{profile.totalTrades}</p>
              </div>
              <div>
                <p className="text-[#9ca3af] text-[10px] uppercase">Best Category</p>
                <p className="text-white font-mono">{profile.strongestCategory || '—'}</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-2 border-t border-border bg-black/20 text-[11px] text-[#9ca3af] flex items-center justify-between">
            <span>polyplot.io/{profile.handle}</span>
            <span className="inline-flex items-center gap-1.5 text-[#cbd5e1]">
              <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#00d4aa] to-[#6366f1] inline-flex items-center justify-center">
                <Activity size={11} className="text-white" />
              </span>
              PolyPlot
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={downloadCard} className="rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium inline-flex items-center justify-center gap-2">
            <Download size={14} /> Download PNG
          </button>
          <button onClick={copyLink} className="rounded-lg border border-border bg-secondary py-2 text-sm inline-flex items-center justify-center gap-2">
            <Copy size={14} /> {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
}
