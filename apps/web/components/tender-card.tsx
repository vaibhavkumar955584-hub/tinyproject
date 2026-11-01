'use client';

import { ArrowUpRight, BellPlus, Clock3, FileWarning, MapPin, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { Verdict } from '@tenderguard/shared';
import { api } from '../lib/api';
import { ScoreRing, VerdictBadge } from './verdict';

export interface TenderCardData {
  id: string;
  source: 'CPPP' | 'GEM';
  sourceTenderId: string;
  title: string;
  department?: string | null;
  location?: string | null;
  closingAt?: string | null;
  estimatedValueInr?: string | null;
  emdInr?: string | null;
  fetchStatus: 'OK' | 'FETCH_FAILED' | 'NEEDS_MANUAL_STEP';
  verdict?: { verdict: Verdict; score: number; reasons: Array<{ explanation: string; status: string }> } | null;
  watch?: { id: string } | null;
}

export function formatInr(value: string | number | null | undefined): string {
  if (value === undefined || value === null) return 'Not stated';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Not stated';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
}

function closeLabel(value?: string | null): { label: string; urgent: boolean } {
  if (!value) return { label: 'Deadline not verified', urgent: false };
  const hours = (new Date(value).getTime() - Date.now()) / 3_600_000;
  if (hours < 0) return { label: 'Deadline passed', urgent: false };
  const days = Math.floor(hours / 24);
  return { label: days < 1 ? 'Closes today' : `Closes in ${days} days`, urgent: days < 3 };
}

export function TenderCard({ tender, onWatch }: { tender: TenderCardData; onWatch?: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const deadline = closeLabel(tender.closingAt);

  const watch = async () => {
    if (tender.watch) return;
    setBusy(true);
    try {
      await api('/watches', { method: 'POST', body: JSON.stringify({ tenderId: tender.id, intervalHours: 6 }) });
      setMessage('Added to watchlist');
      onWatch?.(tender.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add watch');
    } finally { setBusy(false); }
  };

  const summary = tender.verdict?.reasons?.find((reason) => reason.status === 'FAIL' || reason.status === 'RISK' || reason.status === 'UNKNOWN')?.explanation
    ?? (tender.fetchStatus === 'NEEDS_MANUAL_STEP' ? 'The portal needs a manual step before analysis.' : tender.fetchStatus !== 'OK' ? 'The page could not be read; eligibility is unknown.' : 'No eligibility blockers were found in the extracted conditions.');

  const verdictColor = tender.verdict?.verdict === 'BID' ? 'border-[#c3dbc9] bg-[#edf5ef]' : tender.verdict?.verdict === 'DONT_BID' ? 'border-[#efc7c2] bg-[#fbefed]' : 'border-[#ead5ad] bg-[#fbf4e7]';

  return (
    <article className={`surface animate-in p-5 sm:p-6 group border-2 border-transparent hover:border-[#e6e1d8] dark:hover:border-[#3a342e] transition-[border-color,box-shadow,transform] ${verdictColor}`}>
      <div className="flex items-start gap-4">
        <ScoreRing score={tender.verdict?.score ?? 0} size={52} />
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={tender.verdict?.verdict ?? 'RISKY'} />
            <span className="badge badge-blue">{tender.source === 'CPPP' ? 'CPPP' : 'GeM'}</span>
            {tender.fetchStatus === 'NEEDS_MANUAL_STEP' && <span className="badge badge-risk"><FileWarning size={13} />Manual step</span>}
          </div>
          <Link href={`/tenders/${tender.id}`} className="group block">
            <h2 className="text-lg font-bold leading-snug tracking-tight group-hover:text-[#355a78] dark:group-hover:text-[#8fb3c9] transition-colors">{tender.title}</h2>
          </Link>
          {tender.department && <p className="muted mt-1.5 text-xs">{tender.department}</p>}
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#69645c] dark:text-[#a49d92]">{summary}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f5ef] p-3 sm:grid-cols-4 dark:bg-[#2d2924]">
        <div>
          <span className="muted flex items-center gap-1 text-[10px] font-semibold uppercase"><Wallet size={12} />Est. value</span>
          <span className="mt-1 block text-xs font-bold">{formatInr(tender.estimatedValueInr)}</span>
        </div>
        <div>
          <span className="muted flex items-center gap-1 text-[10px] font-semibold uppercase"><Wallet size={12} />EMD</span>
          <span className="mt-1 block text-xs font-bold">{formatInr(tender.emdInr)}</span>
        </div>
        <div>
          <span className="muted flex items-center gap-1 text-[10px] font-semibold uppercase"><MapPin size={12} />Location</span>
          <span className="mt-1 block truncate text-xs font-bold">{tender.location || 'Not stated'}</span>
        </div>
        <div>
          <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase ${deadline.urgent ? 'text-[#a66f22]' : 'muted'}`}><Clock3 size={12} />Deadline</span>
          <span className={`mt-1 block text-xs font-bold ${deadline.urgent ? 'text-[#a66f22]' : ''}`}>{deadline.label}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="muted text-[11px]">Tender ref. {tender.sourceTenderId}</span>
        <div className="flex gap-2">
          <button className="btn-secondary py-2 text-xs" onClick={() => void watch()} disabled={busy || Boolean(tender.watch)}>
            <BellPlus size={14} /> {tender.watch ? 'Watching' : busy ? 'Adding…' : 'Watch'}
          </button>
          <Link className="btn-primary py-2 text-xs" href={`/tenders/${tender.id}`}>
            View evidence <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      {message && <p aria-live="polite" className="mt-2 text-right text-xs text-[#355a78] dark:text-[#8fb3c9]">{message}</p>}
    </article>
  );
}

export function TenderCardSkeleton() {
  return (
    <article className="surface p-5 sm:p-6 animate-in">
      <div className="flex items-start gap-4">
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%' }} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="skeleton" style={{ width: '55%', height: 16 }} />
          <div className="skeleton" style={{ width: '100%', height: 22 }} />
        </div>
      </div>
      <div className="mt-4 skeleton" style={{ width: '100%', height: 40 }} />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ width: '100%', height: 56 }} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton btn-secondary" style={{ width: 110, height: 36, pointerEvents: 'none' }} />
        <div className="skeleton btn-primary" style={{ width: 110, height: 36, pointerEvents: 'none' }} />
      </div>
    </article>
  );
}
