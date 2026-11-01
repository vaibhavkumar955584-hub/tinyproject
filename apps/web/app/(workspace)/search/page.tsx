'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowRight, CheckCircle2, Circle, Filter, LoaderCircle, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Verdict } from '@tenderguard/shared';
import { api, apiBaseUrl } from '../../../lib/api';
import { Card, EmptyState, PageTitle } from '../../../components/ui';
import { TenderCard, TenderCardSkeleton, type TenderCardData } from '../../../components/tender-card';
import { useToast } from '../../../components/toast';

interface SearchJob {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
  progress: number;
  logs: Array<{ id: string; step: string; detail: string; ts: string }>;
  results: TenderCardData[];
}

interface ActivityItem { id: string; step: string; detail: string; ts: string }

const statusOrder: Record<Verdict, number> = { BID: 0, RISKY: 1, DONT_BID: 2 };

export default function SearchPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [query, setQuery] = useState('IT helpdesk support');
  const [sources, setSources] = useState(['CPPP', 'GEM']);
  const [jobId, setJobId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | Verdict>('ALL');
  const [closingSoon, setClosingSoon] = useState(false);

  const startSearch = useMutation({
    mutationFn: () => api<{ jobId: string }>('/search-jobs', { method: 'POST', body: JSON.stringify({ query, sources }) }),
    onSuccess: ({ jobId: createdId }) => { setJobId(createdId); setActivities([]); queryClient.setQueryData(['search-job', createdId], undefined); toast({ type: 'info', title: 'Search started', message: 'TenderGuard is checking the selected public portals.' }); },
    onError: (error) => toast({ type: 'error', title: 'Search could not start', message: error.message }),
  });
  const jobQuery = useQuery({
    queryKey: ['search-job', jobId],
    queryFn: () => api<SearchJob>(`/search-jobs/${jobId}`),
    enabled: Boolean(jobId),
    refetchInterval: (queryResult) => queryResult.state.data?.status === 'QUEUED' || queryResult.state.data?.status === 'RUNNING' ? 1_000 : false,
  });

  useEffect(() => {
    if (!jobId) return;
    const stream = new EventSource(`${apiBaseUrl()}/search-jobs/${jobId}/events`, { withCredentials: true });
    stream.addEventListener('activity', (event) => {
      const item = JSON.parse((event as MessageEvent<string>).data) as ActivityItem;
      setActivities((previous) => previous.some((entry) => entry.id === item.id) ? previous : [...previous, item].slice(-30));
    });
    stream.addEventListener('complete', (event) => {
      stream.close();
      void jobQuery.refetch();
      const completion = JSON.parse((event as MessageEvent<string>).data) as { status: 'DONE' | 'FAILED' };
      toast(completion.status === 'FAILED'
        ? { type: 'error', title: 'Search could not finish', message: 'You can check the activity panel and try again.' }
        : { type: 'success', title: 'Search complete', message: 'Your results are ready to review.' });
    });
    stream.onerror = () => stream.close();
    return () => stream.close();
  }, [jobId, toast]);

  const results = useMemo(() => {
    return [...(jobQuery.data?.results ?? [])]
      .filter((item) => filter === 'ALL' || item.verdict?.verdict === filter)
      .filter((item) => !closingSoon || Boolean(item.closingAt && new Date(item.closingAt).getTime() - Date.now() < 3 * 86_400_000))
      .sort((a, b) => statusOrder[a.verdict?.verdict ?? 'RISKY'] - statusOrder[b.verdict?.verdict ?? 'RISKY'] || (b.verdict?.score ?? 0) - (a.verdict?.score ?? 0) || new Date(a.closingAt ?? '9999-12-31').getTime() - new Date(b.closingAt ?? '9999-12-31').getTime());
  }, [jobQuery.data?.results, filter, closingSoon]);

  const timeline = activities.length ? activities : jobQuery.data?.logs ?? [];
  const running = jobQuery.data?.status === 'QUEUED' || jobQuery.data?.status === 'RUNNING';
  const sourceToggle = (source: string) => setSources((current) => current.includes(source) ? current.filter((item) => item !== source) : [...current, source]);

  return (
    <>
      <PageTitle eyebrow="Tender discovery" title="Find tenders worth your time" description="Tell the agent what you deliver. TenderGuard checks public notices against your business profile and shows the source clause behind every risk." action={<span className="badge badge-blue"><Sparkles size={13} />Evidence-backed screening</span>} />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.75fr)]">
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <form onSubmit={(event) => { event.preventDefault(); startSearch.mutate(); }}>
              <label htmlFor="tender-query" className="mb-2 block text-sm font-bold">What work are you looking for?</label>
              <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="muted absolute left-3.5 top-1/2 -translate-y-1/2" size={18} /><input id="tender-query" className="field pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. endpoint support, office furniture, road works" minLength={3} maxLength={500} required /></div><button disabled={startSearch.isPending || running || sources.length === 0} className="btn-primary min-w-36 disabled:cursor-not-allowed disabled:opacity-60"><span>Run agent</span>{startSearch.isPending || running ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={17} />}</button></div>
              <div className="mt-4 flex flex-wrap items-center gap-2"><span className="muted mr-1 text-xs font-semibold">Search public portals</span>{['CPPP', 'GEM'].map((source) => <button key={source} type="button" aria-pressed={sources.includes(source)} onClick={() => sourceToggle(source)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${sources.includes(source) ? 'border-[#355a78] bg-[#e9f0f5] text-[#355a78]' : 'border-[#e6e1d8] text-[#777168]'}`}>{source === 'GEM' ? 'GeM' : source}</button>)}<span className="ml-auto text-[11px] text-[#938c81]">Fixture mode is offline demo data</span></div>
              {startSearch.isError && <p role="alert" className="mt-3 text-sm text-[#b9473f]">{startSearch.error.message}</p>}
            </form>
          </Card>

          {jobId && jobQuery.data && <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-bold"><Activity size={17} className="text-[#355a78]" />{running ? 'Agent is reviewing public notices' : jobQuery.data.status === 'FAILED' ? 'Search needs attention' : 'Search complete'}</div><span className="text-xs font-bold text-[#355a78]">{jobQuery.data.progress}%</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e9e5dd]"><div className="h-full rounded-full bg-[#355a78] transition-[width] duration-500" style={{ width: `${jobQuery.data.progress}%` }} /></div>
            <div className="mt-3 flex justify-between text-[10px] font-semibold text-[#817b72]"><span>Discover</span><span>Read clauses</span><span>Check eligibility</span><span>Rank</span></div>
          </Card>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-bold">{results.length ? `${results.length} tender${results.length === 1 ? '' : 's'} screened` : 'Your screened tenders'}</h2><p className="muted mt-1 text-xs">Ranked by eligibility, readiness, and closing date</p></div>
            {jobQuery.data?.results?.length ? <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="verdict-filter">Filter by verdict</label><select id="verdict-filter" className="field w-auto py-2 text-xs" value={filter} onChange={(event) => setFilter(event.target.value as 'ALL' | Verdict)}><option value="ALL">All verdicts</option><option value="BID">Bid</option><option value="RISKY">Risky</option><option value="DONT_BID">Don’t bid</option></select><button onClick={() => setClosingSoon((value) => !value)} aria-pressed={closingSoon} className={`btn-secondary py-2 text-xs ${closingSoon ? 'border-[#355a78] bg-[#e9f0f5] text-[#355a78]' : ''}`}><Filter size={14} />Closing soon</button></div> : null}
          </div>

          {jobQuery.isPending && jobId ? <div className="space-y-4" aria-label="Loading search results"><TenderCardSkeleton /><TenderCardSkeleton /></div> : null}
          {jobQuery.data?.status === 'FAILED' && <EmptyState icon={<Activity size={21} />} title="This search did not finish" body="Your profile is still safe. Check the API and database connection, then run the search again." action={<button className="btn-secondary" onClick={() => startSearch.mutate()}>Try again</button>} />}
          {jobQuery.data?.status === 'DONE' && results.length === 0 && <EmptyState icon={<Search size={22} />} title="No tenders match these filters" body="Try a broader query or turn off the closing-soon filter. TenderGuard only shows pages it can read from the selected public portals." />}
          {results.map((tender) => <TenderCard key={tender.id} tender={tender} onWatch={() => void queryClient.invalidateQueries({ queryKey: ['watches'] })} />)}
          {!jobId && <EmptyState icon={<Search size={22} />} title="Start with your next contract" body="Fixture mode includes three demo notices so you can inspect a clear BID, a RISKY tender, and a DONT BID decision without portal credentials." action={<button className="btn-primary" onClick={() => startSearch.mutate()}><Sparkles size={16} />Run the demo search</button>} />}
          {jobQuery.data?.status === 'RUNNING' && !jobQuery.data.results.length && <Card className="flex items-center gap-3 p-5"><LoaderCircle className="animate-spin text-[#355a78]" size={20} /><span className="muted text-sm">The agent is reading tender pages and validating exact source clauses…</span></Card>}
        </div>

        <aside className="xl:sticky xl:top-[92px]">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between border-b border-[#e6e1d8] bg-[#f0f4f5] px-5 py-4"><div><p className="eyebrow">Live agent activity</p><h2 className="mt-1 text-base font-bold">Search trace</h2></div><span className={`mt-1 flex items-center gap-1.5 text-[10px] font-bold ${running ? 'text-[#3f7458]' : 'text-[#777168]'}`}><span className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-[#3f7458]' : 'bg-[#9b958a]'}`} />{running ? 'LIVE' : 'READY'}</span></div>
            <div className="max-h-[550px] space-y-0 overflow-y-auto p-5">
              {timeline.length ? timeline.map((item, index) => <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0"><div className="flex flex-col items-center"><span className="relative z-10 mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-[#e9f2ec] text-[#3f7458]">{index === timeline.length - 1 && running ? <LoaderCircle className="animate-spin" size={13} /> : <CheckCircle2 size={14} />}</span>{index < timeline.length - 1 && <span className="absolute top-6 h-full w-px bg-[#d9e5dc]" />}</div><div className="min-w-0"><p className="text-xs font-bold capitalize">{item.step.replaceAll('_', ' ')}</p><p className="muted mt-1 text-xs leading-5">{item.detail}</p><p className="mt-1 text-[10px] text-[#a49d92]">{new Date(item.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></div></div>) : <div className="py-7 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f0ede6] text-[#847969]"><Circle size={19} /></span><p className="mt-3 text-sm font-bold">Ready when you are</p><p className="muted mt-1 text-xs leading-5">Your agent will show each portal action and analysis step here.</p></div>}
            </div>
            <div className="border-t border-[#e6e1d8] bg-[#fcfbf7] px-5 py-4"><p className="flex items-center gap-2 text-[11px] font-bold text-[#355a78]"><ShieldCheckIcon />Public pages only</p><p className="muted mt-1 text-[10px] leading-4">No bidder sign-in, CAPTCHA bypass, or bid submission.</p></div>
          </Card>
          <div className="muted mt-3 flex items-center gap-2 px-1 text-[10px]"><Link href="/onboarding" className="font-bold text-[#355a78]">Edit business profile</Link><span>·</span><span>Better profile data means better screening.</span></div>
        </aside>
      </div>
    </>
  );
}

function ShieldCheckIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 20 6v5c0 5-3.2 8.3-8 10-4.8-1.7-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></svg>;
}
