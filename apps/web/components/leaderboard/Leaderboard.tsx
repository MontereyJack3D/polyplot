'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUp, Minus, Trophy } from 'lucide-react';
import { useState } from 'react';

import { ErrorState } from '@/components/shared/page-states';
import { EdgeScoreRing } from '@/components/ui/edge-score-ring';
import { SparkLine } from '@/components/ui/spark-line';
import { useLeaderboard } from '@/lib/hooks/use-leaderboard';

const categories = ['All', 'Politics', 'Crypto', 'Sports', 'Finance', 'Science', 'Culture'];

export function Leaderboard() {
  const [view, setView] = useState<'table' | 'card'>('table');
  const [category, setCategory] = useState('All');

  const leaderboard = useLeaderboard(category);
  const entries = ((leaderboard.data as { entries?: Array<any> } | undefined)?.entries ?? []) as Array<any>;

  if (leaderboard.isError) return <ErrorState message="Failed to load leaderboard" onRetry={() => leaderboard.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 p-1">
          <button onClick={() => setView('table')} className={['px-2.5 py-1 rounded-md text-xs', view === 'table' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}>Table View</button>
          <button onClick={() => setView('card')} className={['px-2.5 py-1 rounded-md text-xs', view === 'card' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'].join(' ')}>Card View</button>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border border-border rounded-lg px-2.5 py-2 text-xs">
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {leaderboard.isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
      {!leaderboard.isLoading && entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No leaderboard entries for this filter.
        </div>
      ) : null}

      {entries.length > 0 && view === 'table' ? (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-xs border-b border-border">
                <th className="px-4 py-3">Rank</th><th className="px-4 py-3">Δ</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Edge Score</th><th className="px-4 py-3">Win Rate</th><th className="px-4 py-3">Trades</th><th className="px-4 py-3">Strongest Category</th><th className="px-4 py-3">Momentum</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.handle} className="border-b border-border/60 hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono">{entry.rank <= 3 ? <span className="inline-flex items-center gap-1"><Trophy size={12} className={entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-slate-300' : 'text-amber-600'} />{entry.rank}</span> : entry.rank}</td>
                  <td className="px-4 py-3">
                    {entry.previousRank === null || entry.previousRank === entry.rank ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus size={12} /> —</span>
                    ) : entry.previousRank > entry.rank ? (
                      <span className="inline-flex items-center gap-1 text-[#22c55e]"><ArrowUp size={12} /> {entry.previousRank - entry.rank}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#ef4444]"><ArrowDown size={12} /> {entry.rank - entry.previousRank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/u/${entry.handle}`} className="inline-flex items-center gap-2 hover:text-primary">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#6366f1] flex items-center justify-center text-white text-[10px]">{(entry.displayName || entry.handle).slice(0, 2).toUpperCase()}</span>
                      <span>{entry.displayName || entry.handle}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-primary">{entry.edgeScore.toFixed(1)}</td>
                  <td className="px-4 py-3 font-mono">{(entry.winRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 font-mono">{entry.trades}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-secondary text-xs">{entry.strongestCategory ?? '—'}</span></td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <SparkLine values={entry.rankSparkline ?? [entry.edgeScore]} width={72} height={20} positive={(entry.momentum ?? 50) >= 50} />
                      <span className="font-mono text-xs">{entry.momentum.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {entries.slice(0, 3).map((entry) => (
              <Link key={entry.handle} href={`/u/${entry.handle}`} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:border-primary/40">
                <div>
                  <p className="text-xs text-muted-foreground">#{entry.rank}</p>
                  <p className="mt-1">{entry.displayName || entry.handle}</p>
                  <p className="text-xs text-muted-foreground mt-1">{entry.strongestCategory ?? '—'}</p>
                  <p className="text-xs mt-1">
                    {entry.previousRank === null || entry.previousRank === entry.rank ? (
                      <span className="text-muted-foreground inline-flex items-center gap-1"><Minus size={11} /> Stable</span>
                    ) : entry.previousRank > entry.rank ? (
                      <span className="text-[#22c55e] inline-flex items-center gap-1"><ArrowUp size={11} /> +{entry.previousRank - entry.rank}</span>
                    ) : (
                      <span className="text-[#ef4444] inline-flex items-center gap-1"><ArrowDown size={11} /> -{entry.rank - entry.previousRank}</span>
                    )}
                  </p>
                </div>
                <EdgeScoreRing score={entry.edgeScore} size={90} />
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {entries.slice(3).map((entry) => (
              <Link key={entry.handle} href={`/u/${entry.handle}`} className="bg-card border border-border rounded-xl p-3 hover:border-primary/40">
                <p>{entry.displayName || entry.handle}</p>
                <p className="text-xs text-muted-foreground mt-1">Edge {entry.edgeScore.toFixed(1)} · {(entry.winRate * 100).toFixed(1)}% WR</p>
                <div className="mt-2">
                  <SparkLine values={entry.rankSparkline ?? [entry.edgeScore]} width={120} height={24} positive={(entry.momentum ?? 50) >= 50} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
