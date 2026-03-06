'use client';

interface OpportunityCardProps {
  question: string;
  category: string;
  venue: string;
  currentProb: number;
  opportunityScore: number;
  explanation: string;
  recommendedAction: string;
  onClick: () => void;
}

export function OpportunityCard({
  question,
  category,
  venue,
  currentProb,
  opportunityScore,
  explanation,
  recommendedAction,
  onClick,
}: OpportunityCardProps) {
  const actionColors = {
    strong_buy: {
      bg: 'bg-[#00d4aa]/10',
      border: 'border-[#00d4aa]/30',
      text: 'text-[#00d4aa]',
      label: 'Strong Signal',
    },
    consider: {
      bg: 'bg-[#6366f1]/10',
      border: 'border-[#6366f1]/30',
      text: 'text-[#6366f1]',
      label: 'Consider',
    },
    watch: {
      bg: 'bg-[#f59e0b]/10',
      border: 'border-[#f59e0b]/30',
      text: 'text-[#f59e0b]',
      label: 'Watch',
    },
    avoid: {
      bg: 'bg-secondary',
      border: 'border-border',
      text: 'text-muted-foreground',
      label: 'Low Signal',
    },
  } as const;

  const style =
    actionColors[recommendedAction as keyof typeof actionColors] ?? actionColors.watch;

  return (
    <div
      onClick={onClick}
      className={`${style.bg} border ${style.border} rounded-xl p-5 cursor-pointer hover:scale-[1.01] transition-transform`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
          {style.label}
        </span>
        <span className={`text-[20px] font-mono font-bold ${style.text}`}>
          {opportunityScore.toFixed(0)}
        </span>
      </div>
      <p className="text-foreground text-[14px] leading-snug mb-2 line-clamp-2">{question}</p>
      <p className="text-muted-foreground text-[12px] mb-3">{explanation}</p>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-mono text-primary">{(currentProb * 100).toFixed(0)}%</span>
        <span>·</span>
        <span>{category}</span>
        <span>·</span>
        <span>{venue}</span>
      </div>
    </div>
  );
}
