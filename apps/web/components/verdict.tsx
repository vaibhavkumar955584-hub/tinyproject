import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { Verdict } from '@tenderguard/shared';

const verdictInfo: Record<Verdict, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  BID: { label: 'BID', className: 'badge-bid', icon: CheckCircle2 },
  RISKY: { label: 'RISKY', className: 'badge-risk', icon: AlertTriangle },
  DONT_BID: { label: "DON'T BID", className: 'badge-dont', icon: XCircle },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const info = verdictInfo[verdict];
  const Icon = info.icon;
  return <span className={`badge ${info.className}`}><Icon size={14} strokeWidth={2.4} aria-hidden="true" />{info.label}</span>;
}

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const color = score >= 75 ? 'var(--verdict-bid)' : score >= 40 ? 'var(--verdict-risky)' : 'var(--verdict-dont)';
  return <div className="grid shrink-0 place-items-center rounded-full" role="img" aria-label={`Readiness score ${score} out of 100`} style={{ width: size, height: size, background: `conic-gradient(${color} ${score * 3.6}deg, var(--verdict-track) 0deg)` }}><div className="grid place-items-center rounded-full bg-[#fffefa] font-bold" style={{ width: size - 9, height: size - 9, fontSize: size < 60 ? 12 : 16 }}>{score}</div></div>;
}
