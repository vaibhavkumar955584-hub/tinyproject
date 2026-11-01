'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, BellPlus, Check, CheckCircle2, CircleHelp, Clock3, Download, ExternalLink, FileWarning, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Verdict } from '@tenderguard/shared';
import { Card, PageTitle } from '../../../../components/ui';
import { ScoreRing, VerdictBadge } from '../../../../components/verdict';
import { formatInr } from '../../../../components/tender-card';
import { api } from '../../../../lib/api';

interface Requirement {
  id: string;
  type: string;
  valueJson: Record<string, unknown>;
  sourceUrl: string;
  sourceQuote: string;
  confidence: number;
}
interface Reason { requirement: Requirement; status: 'PASS' | 'FAIL' | 'RISK' | 'UNKNOWN'; explanation: string; profileValue?: unknown; tenderValue?: unknown }
interface ChecklistItem { item: string; done: boolean; why: string; quote?: string }
interface TenderDetail {
  id: string; source: 'CPPP' | 'GEM'; sourceTenderId: string; url: string; title: string; department?: string | null; location?: string | null;
  estimatedValueInr: string | null; emdInr: string | null; closingAt?: string | null; rawText: string;
  fetchStatus: 'OK' | 'FETCH_FAILED' | 'NEEDS_MANUAL_STEP'; requirements: Requirement[];
  verdict: { verdict: Verdict; score: number; reasons: Reason[]; checklist: ChecklistItem[] } | null;
  watch: { id: string } | null;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not stated';
  if (typeof value === 'number') return Number.isInteger(value) && value > 1000 ? formatInr(value) : String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${displayValue(item)}`).join(' · ');
}

function statusLabel(status?: string) {
  if (status === 'PASS') return { label: 'Meets', className: 'text-[#3f7458]', icon: CheckCircle2 };
  if (status === 'FAIL') return { label: 'Does not meet', className: 'text-[#b9473f]', icon: CircleHelp };
  if (status === 'RISK') return { label: 'Needs attention', className: 'text-[#a66f22]', icon: CircleHelp };
  return { label: 'Verify', className: 'text-[#355a78]', icon: CircleHelp };
}

export default function TenderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [evidence, setEvidence] = useState<Requirement | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState('');
  const detail = useQuery({ queryKey: ['tender', id], queryFn: () => api<TenderDetail>(`/tenders/${id}`), enabled: Boolean(id) });
  const watch = useMutation({ mutationFn: () => api('/watches', { method: 'POST', body: JSON.stringify({ tenderId: id, intervalHours: 6 }) }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['tender', id] }); await queryClient.invalidateQueries({ queryKey: ['watches'] }); setMessage('Tender added to your watchlist.'); } });

  const reasons = detail.data?.verdict?.reasons ?? [];
  const checklist = detail.data?.verdict?.checklist ?? [];
  const completed = useMemo(() => checklist.filter((_, index) => checkedItems[index]).length, [checklist, checkedItems]);

  if (detail.isPending) return <Card className="p-12 text-center text-sm text-[#777168]">Loading evidence and eligibility…</Card>;
  if (detail.isError || !detail.data) return <Card className="p-10 text-center"><h1 className="text-xl font-bold">Tender details unavailable</h1><p className="muted mt-2 text-sm">{detail.error?.message ?? 'This tender may have been removed.'}</p><Link href="/search" className="btn-secondary mt-5">Back to tenders</Link></Card>;

  const tender = detail.data;
  const overall = tender.verdict?.verdict ?? 'RISKY';
  const evidenceReasons = new Map(reasons.map((reason) => [`${reason.requirement.type}:${reason.requirement.sourceQuote}`, reason]));

  return <>
    <div className="no-print mb-5"><Link href="/search" className="inline-flex items-center gap-2 text-xs font-bold text-[#355a78] hover:underline"><ArrowLeft size={14} />Back to results</Link></div>
    <PageTitle eyebrow={`${tender.source === 'CPPP' ? 'CPPP' : 'Government e-Marketplace'} · Ref ${tender.sourceTenderId}`} title={tender.title} description={tender.department ?? 'Public procurement notice'} action={<a href={tender.url} target="_blank" rel="noreferrer" className="btn-secondary no-print">Official source <ExternalLink size={14} /></a>} />

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="space-y-5">
        <Card className={`overflow-hidden ${overall === 'BID' ? 'border-[#c3dbc9]' : overall === 'DONT_BID' ? 'border-[#efc7c2]' : 'border-[#ead5ad]'}`}>
          <div className={`flex flex-wrap items-center gap-4 p-5 sm:p-7 ${overall === 'BID' ? 'bg-[#edf5ef]' : overall === 'DONT_BID' ? 'bg-[#fbefed]' : 'bg-[#fbf4e7]'}`}>
            <ScoreRing score={tender.verdict?.score ?? 0} size={68} />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><VerdictBadge verdict={overall} />{tender.fetchStatus === 'NEEDS_MANUAL_STEP' && <span className="badge badge-risk"><FileWarning size={13} />Needs manual step</span>}</div><h2 className="mt-2 text-lg font-bold">{overall === 'BID' ? 'Your profile appears to meet the stated requirements.' : overall === 'DONT_BID' ? 'One or more hard requirements do not match your profile.' : 'Some conditions need your attention before you decide.'}</h2><p className="muted mt-1 text-xs">Automated screening from extracted clauses. Use the evidence table below to verify each point.</p></div>
          </div>
          {tender.fetchStatus === 'NEEDS_MANUAL_STEP' && <div className="flex gap-2 border-t border-[#e6e1d8] bg-[#fffefa] px-5 py-4 text-xs leading-5 text-[#8a5b16]"><FileWarning size={16} className="mt-0.5 shrink-0" /><p>The portal presented a CAPTCHA or sign-in wall. TenderGuard stopped here and did not attempt to pass it. Review this tender manually; the current verdict is unknown.</p></div>}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e1d8] px-5 py-4 sm:px-6"><div><p className="eyebrow">Eligibility evidence</p><h2 className="mt-1 text-lg font-bold">Tender needs · You have · Status</h2></div><span className="badge badge-blue"><ShieldCheck size={13} />{tender.requirements.length} clauses</span></div>
          {tender.requirements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead className="bg-[#f7f5ef] text-[10px] font-extrabold uppercase tracking-wide text-[#817b72]"><tr><th className="px-5 py-3">Requirement</th><th className="px-5 py-3">Tender needs</th><th className="px-5 py-3">You have</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Evidence</th></tr></thead><tbody>{tender.requirements.map((requirement) => {
            const reason = evidenceReasons.get(`${requirement.type}:${requirement.sourceQuote}`);
            const status = statusLabel(reason?.status);
            const Icon = status.icon;
            return <tr key={requirement.id} className="border-t border-[#eee9e1] align-top"><td className="px-5 py-4 text-xs font-bold">{requirement.type.toLocaleLowerCase().replaceAll('_', ' ')}</td><td className="max-w-[220px] px-5 py-4 text-xs leading-5">{displayValue(requirement.valueJson)}</td><td className="max-w-[220px] px-5 py-4 text-xs leading-5">{displayValue(reason?.profileValue)}</td><td className={`px-5 py-4 text-xs font-bold ${status.className}`}><span className="flex items-center gap-1.5"><Icon size={14} />{status.label}</span></td><td className="px-5 py-4"><button onClick={() => setEvidence(requirement)} className="inline-flex items-center gap-1 text-xs font-bold text-[#355a78] hover:underline">Open quote <ArrowUpRight size={13} /></button></td></tr>;
          })}</tbody></table></div> : <div className="p-6 text-sm text-[#777168]">No requirements were extracted with verified source quotes. Treat the eligibility as unknown until you inspect the official document.</div>}
          <div className="border-t border-[#e6e1d8] px-5 py-3 text-[10px] text-[#817b72]">Source quotes are checked against the tender text before a requirement is saved.</div>
        </Card>

        <Card className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Bid-readiness checklist</p><h2 className="mt-1 text-lg font-bold">{completed} of {checklist.length} ready</h2></div><button onClick={() => window.print()} className="btn-secondary no-print py-2 text-xs"><Download size={14} />Export as PDF</button></div>
          {checklist.length ? <div className="mt-5 space-y-2">{checklist.map((item, index) => <label key={`${item.item}-${index}`} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${checkedItems[index] ? 'border-[#c3dbc9] bg-[#edf5ef]' : 'border-[#e6e1d8] bg-[#fffefa]'}`}><input type="checkbox" className="mt-1 accent-[#3f7458]" checked={checkedItems[index] ?? item.done} onChange={(event) => setCheckedItems((current) => ({ ...current, [index]: event.target.checked }))} /><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#f2efe8] text-[#694d38]"><Check size={14} /></span><span className="flex-1"><span className="block text-xs font-bold">{item.item}</span><span className="muted mt-1 block text-[11px] leading-5">{item.why}</span>{item.quote && <button type="button" onClick={(event) => { event.preventDefault(); const related = tender.requirements.find((req) => req.sourceQuote === item.quote); if (related) setEvidence(related); }} className="mt-1 text-[10px] font-bold text-[#355a78]">View supporting clause</button>}</span></label>)}</div> : <p className="muted mt-4 text-sm">No additional checklist items were generated from the extracted tender details.</p>}
        </Card>

        <Card className="p-5 sm:p-6"><div className="flex items-center gap-2"><CircleHelp className="text-[#a66f22]" size={18} /><h2 className="text-base font-bold">Questions to verify</h2></div>{reasons.filter((reason) => reason.status === 'UNKNOWN' || reason.status === 'RISK').length ? <ul className="mt-4 space-y-3">{reasons.filter((reason) => reason.status === 'UNKNOWN' || reason.status === 'RISK').map((reason, index) => <li key={`${reason.requirement.type}-${index}`} className="rounded-xl bg-[#fbf4e7] p-3"><p className="text-xs font-bold">{reason.requirement.type.toLowerCase().replaceAll('_', ' ')}</p><p className="muted mt-1 text-xs leading-5">{reason.explanation}</p>{reason.requirement.sourceQuote && <button onClick={() => setEvidence(reason.requirement)} className="mt-2 text-[10px] font-bold text-[#355a78]">Open clause</button>}</li>)}</ul> : <p className="muted mt-3 text-sm">No unresolved risk questions were recorded for this analysis.</p>}</Card>
        <p className="rounded-xl border border-[#e6e1d8] bg-[#fffefa] p-4 text-xs leading-5 text-[#777168]">Decision support, not legal advice. Verify against the official tender document.</p>
      </div>

      <aside className="no-print space-y-4 xl:sticky xl:top-[92px]">
        <Card className="p-5"><p className="eyebrow">Tender snapshot</p><div className="mt-4 space-y-4"><Snapshot icon={<Wallet size={15} />} label="Estimated value" value={formatInr(tender.estimatedValueInr)} /><Snapshot icon={<Wallet size={15} />} label="Earnest money deposit" value={formatInr(tender.emdInr)} /><Snapshot icon={<MapPin size={15} />} label="Delivery location" value={tender.location || 'Not stated'} /><Snapshot icon={<Clock3 size={15} />} label="Closing date" value={tender.closingAt ? new Date(tender.closingAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }) : 'Not verified'} /></div><a href={tender.url} target="_blank" rel="noreferrer" className="btn-secondary mt-5 w-full text-xs">Open official page <ExternalLink size={14} /></a></Card>
        <Card className="bg-[#355a78] p-5 text-white"><div className="flex items-center gap-2"><BellPlus size={17} /><h3 className="text-sm font-bold">Watch for changes</h3></div><p className="mt-2 text-xs leading-5 text-[#d5e0e6]">Get alerted when TenderGuard detects a deadline, EMD, or eligibility change.</p><button disabled={watch.isPending || Boolean(tender.watch)} onClick={() => watch.mutate()} className="mt-4 w-full rounded-xl bg-[#fffefa] px-4 py-3 text-xs font-bold text-[#355a78] disabled:opacity-70">{tender.watch ? 'On your watchlist' : watch.isPending ? 'Adding…' : 'Add to watchlist'}</button>{watch.isError && <p className="mt-2 text-xs text-[#ffe1cf]">{watch.error.message}</p>}{message && <p aria-live="polite" className="mt-2 text-xs text-[#d9eadf]">{message}</p>}</Card>
        {tender.verdict && <Card className="p-5"><p className="eyebrow">Risk summary</p><div className="mt-3 space-y-3">{reasons.slice(0, 3).map((reason, index) => { const status = statusLabel(reason.status); const Icon = status.icon; return <p key={index} className={`flex gap-2 text-xs leading-5 ${status.className}`}><Icon size={14} className="mt-0.5 shrink-0" /><span>{reason.explanation}</span></p>; })}</div></Card>}
      </aside>
    </div>

    {evidence && <div className="no-print fixed inset-0 z-50 flex justify-end bg-[#201a14]/35" role="presentation" onClick={() => setEvidence(null)}><aside role="dialog" aria-modal="true" aria-labelledby="evidence-title" onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-[500px] animate-in overflow-y-auto bg-[#fffefa] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="eyebrow">Source evidence</p><h2 id="evidence-title" className="mt-1 text-xl font-bold">{evidence.type.toLowerCase().replaceAll('_', ' ')}</h2></div><button aria-label="Close evidence panel" onClick={() => setEvidence(null)} className="grid h-9 w-9 place-items-center rounded-full border border-[#e6e1d8]">×</button></div><div className="mt-7 rounded-2xl border border-[#cbd9e2] bg-[#edf3f6] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#355a78]">Exact source clause</p><blockquote className="mt-3 text-sm font-medium leading-7 text-[#2b2926]">“{evidence.sourceQuote}”</blockquote></div><dl className="mt-5 space-y-4"><div><dt className="muted text-[10px] font-bold uppercase tracking-wide">Extracted tender need</dt><dd className="mt-1 text-sm font-semibold">{displayValue(evidence.valueJson)}</dd></div><div><dt className="muted text-[10px] font-bold uppercase tracking-wide">Source confidence</dt><dd className="mt-1 text-sm font-semibold">{Math.round(evidence.confidence * 100)}% · quote verified against page text</dd></div><div><dt className="muted text-[10px] font-bold uppercase tracking-wide">Source URL</dt><dd className="mt-1 break-all text-xs text-[#355a78]">{evidence.sourceUrl}</dd></div></dl><a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="btn-primary mt-7 w-full">Open source page <ArrowUpRight size={15} /></a><p className="muted mt-4 text-[10px] leading-4">Always compare the quote with the current official tender document and corrigenda.</p></aside></div>}
  </>;
}

function Snapshot({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-2.5"><span className="mt-0.5 text-[#355a78]">{icon}</span><div><p className="muted text-[10px] font-semibold uppercase tracking-wide">{label}</p><p className="mt-1 text-xs font-bold">{value}</p></div></div>;
}
