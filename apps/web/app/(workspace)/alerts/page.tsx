'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, BellRing, CalendarClock, ExternalLink, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Card, EmptyState, PageTitle } from '../../../components/ui';
import { VerdictBadge } from '../../../components/verdict';
import { api } from '../../../lib/api';
import { useState } from 'react';
import { SkeletonList } from '../../../components/skeleton';

interface AlertItem { id: string; changeType: 'DEADLINE' | 'EMD' | 'CONDITION' | 'OTHER'; beforeJson: Record<string, unknown>; afterJson: Record<string, unknown>; verdictBefore: string | null; verdictAfter: string | null; sentAt: string | null; createdAt: string; tender: { id: string; title: string; source: string; url: string } }

function stringify(value: unknown): string {
  if (value === null || value === undefined) return 'Not stated';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && !Array.isArray(value)) return Object.entries(value as Record<string, unknown>).map(([key, entry]) => `${key}: ${stringify(entry)}`).join(' · ');
  return String(value);
}

export default function AlertsPage() {
  const [chatId, setChatId] = useState('');
  const [telegramNotice, setTelegramNotice] = useState('');
  const query = useQuery({ queryKey: ['alerts'], queryFn: () => api<AlertItem[]>('/alerts') });
  const linkTelegram = useMutation({ mutationFn: () => api<{ linked: true }>('/telegram/link', { method: 'POST', body: JSON.stringify({ chatId }) }), onSuccess: () => { setTelegramNotice('Telegram connected. You will receive watched-tender updates.'); setChatId(''); }, onError: (error) => setTelegramNotice(error.message) });
  return <>
    <PageTitle eyebrow="Tender changes" title="Alerts & corrigenda" description="A change feed for deadlines, EMD values, eligibility clauses, and verdict changes on tenders you watch." action={<span className="badge badge-blue"><BellRing size={13} />Meaningful changes only</span>} />
    <Card className="mb-5 flex flex-wrap items-end gap-3 p-4 sm:p-5"><div className="min-w-[220px] flex-1"><p className="text-sm font-bold">Connect Telegram alerts</p><p className="muted mt-1 text-xs">Start your configured TenderGuard bot, then enter your numeric chat ID. Email alerts use your account address when SMTP is configured.</p><label htmlFor="telegram-chat-id" className="sr-only">Telegram chat ID</label><input id="telegram-chat-id" value={chatId} onChange={(event) => setChatId(event.target.value)} inputMode="numeric" className="field mt-3 max-w-sm" placeholder="Telegram chat ID" /></div><button type="button" disabled={linkTelegram.isPending || !chatId.trim()} onClick={() => linkTelegram.mutate()} className="btn-secondary">{linkTelegram.isPending ? 'Connecting…' : 'Connect Telegram'}</button>{telegramNotice && <p aria-live="polite" className="w-full text-xs text-[#355a78]">{telegramNotice}</p>}</Card>
    {query.isPending ? <SkeletonList items={3} /> : null}
    {query.isError && <Card className="p-5 text-sm text-[#b9473f]">{query.error.message}</Card>}
    {query.data?.length === 0 && <EmptyState icon={<BellRing size={21} />} title="No changes yet" body="When a watched tender changes, TenderGuard will show the old and new values here and explain what to recheck." action={<Link href="/search" className="btn-primary">Browse tenders</Link>} />}
    <div className="space-y-4">{query.data?.map((alert) => {
      const Icon = alert.changeType === 'DEADLINE' ? CalendarClock : alert.changeType === 'EMD' ? Wallet : FileText;
      const field = alert.changeType === 'DEADLINE' ? 'Closing date' : alert.changeType === 'EMD' ? 'EMD' : alert.changeType === 'CONDITION' ? 'Eligibility condition' : 'Tender details';
      return <Card key={alert.id} className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e6e1d8] bg-[#fffefa] px-5 py-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9f0f5] text-[#355a78]"><Icon size={17} /></span><div><p className="text-sm font-bold">{field} changed</p><p className="muted mt-1 text-[10px]">{new Date(alert.createdAt).toLocaleString('en-IN')} · {alert.tender.source === 'GEM' ? 'GeM' : alert.tender.source}</p></div></div><a href={alert.tender.url} target="_blank" rel="noreferrer" className="btn-secondary py-2 text-xs">Official page <ExternalLink size={13} /></a></div><div className="px-5 py-5"><Link href={`/tenders/${alert.tender.id}`} className="font-bold hover:text-[#355a78]">{alert.tender.title}</Link><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div className="rounded-xl border border-[#efc7c2] bg-[#fbefed] p-3"><p className="text-[10px] font-extrabold uppercase text-[#b9473f]">Before</p><p className="mt-1 text-xs font-semibold text-[#7c342f] line-through decoration-[#b9473f]">{stringify(alert.beforeJson)}</p></div><span className="hidden text-[#817b72] sm:inline"><ArrowRightLeft size={17} /></span><div className="rounded-xl border border-[#c3dbc9] bg-[#edf5ef] p-3"><p className="text-[10px] font-extrabold uppercase text-[#3f7458]">Now</p><p className="mt-1 text-xs font-semibold text-[#315a42]">{stringify(alert.afterJson)}</p></div></div>{alert.verdictBefore && alert.verdictAfter && <div className="mt-4 flex items-center gap-2 text-xs"><span className="muted">Eligibility changed</span><VerdictBadge verdict={alert.verdictBefore as 'BID' | 'RISKY' | 'DONT_BID'} /><ArrowRightLeft size={14} className="text-[#817b72]" /><VerdictBadge verdict={alert.verdictAfter as 'BID' | 'RISKY' | 'DONT_BID'} /></div>}<p className="muted mt-4 text-[10px] leading-4">Recheck the full official tender and any attached corrigendum before acting on this alert.</p></div></Card>;
    })}</div>
  </>;
}
