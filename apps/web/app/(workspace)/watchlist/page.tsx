'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, BellOff, Clock3, ExternalLink, Pause, Play, Trash2, WandSparkles } from 'lucide-react';
import Link from 'next/link';
import { Card, EmptyState, PageTitle } from '../../../components/ui';
import { api } from '../../../lib/api';
import { SkeletonList } from '../../../components/skeleton';
import { useToast } from '../../../components/toast';

interface WatchItem { id: string; active: boolean; intervalHours: number; lastCheckedAt: string | null; tender: { id: string; title: string; source: string; url: string; closingAt: string | null; fetchStatus: string } }

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: ['watches'], queryFn: () => api<WatchItem[]>('/watches') });
  const toggle = useMutation({ mutationFn: ({ id, active }: { id: string; active: boolean }) => api(`/watches/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }), onSuccess: async (_, input) => { toast({ type: 'success', title: input.active ? 'Monitoring resumed' : 'Monitoring paused' }); await queryClient.invalidateQueries({ queryKey: ['watches'] }); }, onError: (error) => toast({ type: 'error', title: 'Could not update monitoring', message: error.message }) });
  const remove = useMutation({ mutationFn: (id: string) => api(`/watches/${id}`, { method: 'DELETE' }), onSuccess: async () => { toast({ type: 'success', title: 'Tender removed from watchlist' }); await queryClient.invalidateQueries({ queryKey: ['watches'] }); }, onError: (error) => toast({ type: 'error', title: 'Could not remove tender', message: error.message }) });
  const simulate = useMutation({ mutationFn: (tenderId: string) => api<{ message: string }>(`/dev/tenders/${tenderId}/simulate-corrigendum`, { method: 'POST' }), onSuccess: async (result) => { toast({ type: 'info', title: 'Demo change created', message: result.message }); await queryClient.invalidateQueries({ queryKey: ['alerts'] }); await queryClient.invalidateQueries({ queryKey: ['watches'] }); }, onError: (error) => toast({ type: 'error', title: 'Could not simulate change', message: error.message }) });

  return <>
    <PageTitle eyebrow="Monitoring" title="Your watchlist" description="TenderGuard checks active watches for meaningful updates to deadlines, EMD, and eligibility clauses." action={<span className="badge badge-blue"><Activity size={13} />15-minute scheduler</span>} />
    {query.isPending ? <SkeletonList items={3} /> : null}
    {query.isError && <Card className="p-5 text-sm text-[#b9473f]">{query.error.message}</Card>}
    {query.data?.length === 0 && <EmptyState icon={<BellOff size={21} />} title="No tenders on your watchlist" body="Open a tender that matters and choose Watch. TenderGuard will compare future portal updates with the last known snapshot." action={<Link href="/search" className="btn-primary">Find tenders</Link>} />}
    <div className="space-y-3">{query.data?.map((watch) => <Card key={watch.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${watch.active ? 'bg-[#e9f0f5] text-[#355a78]' : 'bg-[#f0ede6] text-[#817b72]'}`}><Activity size={18} /></span><div className="min-w-[200px] flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`badge ${watch.active ? 'badge-bid' : 'badge-blue'}`}>{watch.active ? 'Active' : 'Paused'}</span><span className="text-[10px] font-bold uppercase text-[#817b72]">{watch.tender.source === 'GEM' ? 'GeM' : watch.tender.source}</span></div><Link href={`/tenders/${watch.tender.id}`} className="mt-2 block font-bold hover:text-[#355a78]">{watch.tender.title}</Link><div className="muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px]"><span className="flex items-center gap-1"><Clock3 size={12} />Next check every {watch.intervalHours}h</span><span>Last checked {watch.lastCheckedAt ? new Date(watch.lastCheckedAt).toLocaleString('en-IN') : 'Not yet checked'}</span><span>{watch.tender.closingAt ? `Closes ${new Date(watch.tender.closingAt).toLocaleDateString('en-IN')}` : 'Deadline not verified'}</span></div></div><div className="flex flex-wrap gap-2"><button onClick={() => simulate.mutate(watch.tender.id)} disabled={simulate.isPending} className="btn-secondary py-2 text-xs"><WandSparkles size={14} />Simulate change</button><button onClick={() => toggle.mutate({ id: watch.id, active: !watch.active })} className="btn-secondary py-2 text-xs"><span>{watch.active ? <Pause size={14} /> : <Play size={14} />}</span>{watch.active ? 'Pause' : 'Resume'}</button><a href={watch.tender.url} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-2" aria-label="Open official tender page"><ExternalLink size={14} /></a><button onClick={() => remove.mutate(watch.id)} aria-label="Remove tender from watchlist" className="btn-secondary px-3 py-2 text-[#b9473f]"><Trash2 size={14} /></button></div></Card>)}</div>
  </>;
}
