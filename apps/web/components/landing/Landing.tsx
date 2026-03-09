'use client';

import Link from 'next/link';
import { Activity, Target, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

import { EdgeScoreRing } from '@/components/ui/edge-score-ring';

export function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0B0F] text-foreground">
      <div className="h-[3px] w-full bg-gradient-to-r from-[#00d4aa] to-[#6366f1]" />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative mx-auto max-w-6xl px-6 py-6 md:py-10">
          <div className="mb-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center">
                <Activity size={16} className="text-white" />
              </div>
              <span className="text-sm font-medium">PolyPlot</span>
            </div>
            <Link href="/app/leaderboard" className="rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#6366f1] px-4 py-2 text-sm font-medium text-white">
              Open App
            </Link>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="py-10 md:py-20 text-center">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">The Forecasting Arena</h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm md:text-base text-muted-foreground">
              Where forecasters compete to discover signals about the future.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/app/leaderboard" className="rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#6366f1] px-5 py-2.5 text-sm font-medium text-white">
                Open App
              </Link>
              <Link href="/app/leaderboard" className="rounded-lg border border-border px-5 py-2.5 text-sm">
                View Leaderboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-medium mb-6">What is PolyPlot</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: 'Track Your Edge', icon: Activity, text: 'An ELO-style skill rating that measures how well you beat the market — not just whether you win.' },
            { title: 'Discover Signals', icon: Target, text: 'Intelligence engines surface opportunities aligned with your proven strengths across categories and probability bands.' },
            { title: 'Compete & Prove', icon: Trophy, text: 'Public profiles, leaderboards, and achievements. Your track record is your reputation.' },
          ].map((item) => (
            <motion.div key={item.title} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 18 }} viewport={{ once: true }} className="rounded-xl border border-border bg-[#12141A] p-5">
              <div className="mb-4 h-10 w-10 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center">
                <item.icon size={18} className="text-white" />
              </div>
              <h3 className="text-base font-medium">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 border-y border-border/60">
        <h2 className="text-2xl font-medium">Not just PnL. Real skill.</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Edge Score is a 0-100 skill rating inspired by ELO systems. It measures whether you are beating the market consensus — not how much money you have.
        </p>
        <div className="mt-8 flex justify-center">
          <EdgeScoreRing score={78.4} size={190} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Markets Tracked', '2,400+'],
            ['Categories', '10'],
            ['Venues', 'Polymarket · Kalshi'],
            ['Access', 'NFT-Gated Alpha'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="font-mono text-lg text-[#00d4aa]">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 text-center">
        <h2 className="text-2xl font-medium">Private Alpha</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          PolyPlot is currently NFT-gated. Hold a PolyPlot Access NFT to unlock the full experience.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="https://opensea.io/collection/polyplot-access" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-gradient-to-r from-[#00d4aa] to-[#6366f1] px-5 py-2.5 text-sm font-medium text-white">
            Get Access
          </a>
          <Link href="/app/leaderboard" className="rounded-lg border border-border px-5 py-2.5 text-sm">Browse Public Data</Link>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#6366f1]" />
            <span>PolyPlot</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link href="/app/leaderboard">Leaderboard</Link>
            <Link href="/app/markets">Markets</Link>
          </div>
        </div>
        <div className="h-[3px] w-full bg-gradient-to-r from-[#6366f1] to-[#00d4aa]" />
      </footer>
    </div>
  );
}
