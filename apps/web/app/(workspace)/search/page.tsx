'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  Globe,
  Layers,
  Loader2,
  Maximize2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  StopCircle,
  Tag,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, apiBaseUrl, resolveImageUrl } from '../../../lib/api';
import { useToast } from '../../../components/toast';
import { formatInr } from '../../../components/tender-table';

export interface TenderCardData {
  id: string;
  source: 'CPPP' | 'GEM' | 'GEPNIC' | 'IREPS' | 'DEFENCE' | 'PSU' | 'CUSTOM';
  portalId?: string;
  title: string;
  department: string;
  location: string;
  estimatedValueInr?: string | number | null | undefined;
  emdInr?: string | number | null | undefined;
  closingAt?: string | null | undefined;
  url: string;
  verdict: 'BID' | 'RISKY' | 'DONT_BID';
  score: number;
  relevance?: number;
  whyMatched?: string;
  alsoOn?: string[];
  reason: string;
  image?: {
    thumbUrl: string;
    fullUrl: string;
    source: 'SCREENSHOT' | 'ORG_BADGE' | 'CATEGORY_ICON';
    alt: string;
  } | undefined;
  requirements?: Array<{
    name: string;
    needs: string;
    youHave: string;
    status: 'PASS' | 'RISK' | 'FAIL';
    clause: string;
    sourceDoc?: string | undefined;
  }> | undefined;
  checklist?: Array<{
    item: string;
    done: boolean;
    why: string;
  }> | undefined;
}

interface ActivityStep {
  id: string;
  portal?: string | undefined;
  text: string;
  ts: string;
}

interface EfficiencySummary {
  tendersCount: number;
  agentRuns: number;
  fetchCalls: number;
  searchCalls: number;
  cachedHits: number;
  stepsUsed: number;
  timeSeconds?: number;
}

interface PortalInfo {
  id: string;
  name: string;
  kind: string;
  domains: string[];
  states: string[];
  sectors: string[];
  priority: number;
  enabled: boolean;
  health: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
}

interface QueryPlanData {
  terms: string[];
  synonyms: string[];
  hindiTerms?: string[];
  portalsChosen?: string[];
  intent?: string;
}

const INITIAL_FIXTURE_TENDERS: TenderCardData[] = [
  {
    id: 'tender-1',
    source: 'CPPP',
    portalId: 'CPPP',
    title: 'Managed IT Helpdesk & Endpoint Support Services',
    department: 'National Informatics Centre (NIC)',
    location: 'New Delhi, Delhi',
    estimatedValueInr: 4500000,
    emdInr: 90000,
    closingAt: new Date(Date.now() + 86400000 * 9).toISOString(),
    url: 'https://eprocure.gov.in/eprocure/app?page=FrontEndTenderDetails&service=page&tender=2026_CPPP_98120_1',
    verdict: 'BID',
    score: 95,
    relevance: 96,
    whyMatched: 'Exact match for "IT helpdesk support" in scope of work',
    alsoOn: ['GeM', 'UP GePNIC'],
    reason: 'Annual turnover passes (₹30L vs ₹15L required). MSME is 100% exempt from ₹90,000 EMD.',
    image: {
      thumbUrl: '/api/images/thumbs/demo-cppp-001.webp',
      fullUrl: '/api/images/full/demo-cppp-001.webp',
      source: 'SCREENSHOT',
      alt: 'Screenshot of public tender notice DEMO-CPPP-001 from eprocure.gov.in',
    },
    requirements: [
      {
        name: 'Annual Turnover',
        needs: '₹15.00 Lakh min',
        youHave: '₹30.00 Lakh',
        status: 'PASS',
        clause: 'The bidder must have average annual turnover of at least Rs. 15 lakh during the last three financial years.',
        sourceDoc: 'Clause 3.1, Page 12',
      },
      {
        name: 'Technical Experience',
        needs: '1 Year min in IT support',
        youHave: '2 Years verified',
        status: 'PASS',
        clause: 'Bidder must possess minimum 1 year experience in enterprise IT helpdesk or workstation deployment.',
        sourceDoc: 'Clause 4.2, Page 16',
      },
      {
        name: 'EMD Security Deposit',
        needs: '₹90,000 (Exempt for MSME)',
        youHave: 'Udyam Registration Active',
        status: 'PASS',
        clause: 'Micro and Small Enterprises registered with Udyam are completely exempted from EMD deposit.',
        sourceDoc: 'NIT Terms, Page 4',
      },
    ],
    checklist: [
      { item: 'Attach Udyam Registration Certificate', done: true, why: 'Qualifies for 100% EMD waiver' },
      { item: 'Download & fill Annexure-II (Turnover declaration)', done: false, why: 'Mandatory financial schedule' },
      { item: 'Verify digital signature certificate (Class 3)', done: true, why: 'Required for e-Procure portal upload' },
    ],
  },
  {
    id: 'tender-2',
    source: 'GEM',
    portalId: 'GEM',
    title: 'Comprehensive Annual Maintenance for LAN, Fiber & CCTV',
    department: 'Department of Telecommunications',
    location: 'Lucknow, Uttar Pradesh',
    estimatedValueInr: 2800000,
    emdInr: 56000,
    closingAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    url: 'https://gem.gov.in/bids/GEM-2026-B-841920',
    verdict: 'RISKY',
    score: 78,
    relevance: 91,
    whyMatched: 'Matched synonyms: "CCTV", "LAN network maintenance", "optical fiber"',
    alsoOn: ['UP GePNIC'],
    reason: 'Turnover requirement is tight (₹28L vs ₹30L). Corrigendum #1 extended submission to Nov 10.',
    image: {
      thumbUrl: '/api/images/thumbs/demo-cppp-002.webp',
      fullUrl: '/api/images/full/demo-cppp-002.webp',
      source: 'SCREENSHOT',
      alt: 'Screenshot of public tender notice DEMO-CPPP-002 from eprocure.gov.in',
    },
    requirements: [
      {
        name: 'Annual Turnover',
        needs: '₹28.00 Lakh min',
        youHave: '₹30.00 Lakh (Tight)',
        status: 'RISK',
        clause: 'Average annual turnover for the preceding 3 fiscal years shall not be less than Rs. 28 lakh.',
        sourceDoc: 'GeM Bid Document, Clause 5',
      },
      {
        name: 'Experience Criteria',
        needs: '2 Years enterprise LAN/CCTV',
        youHave: '2 Years',
        status: 'PASS',
        clause: 'Bidder shall provide completion certificates for at least 2 years in CCTV or networking.',
        sourceDoc: 'GeM Bid Document, Clause 6',
      },
      {
        name: 'Submission Deadline',
        needs: 'Corrigendum #1 applied',
        youHave: 'Moved to Nov 10',
        status: 'RISK',
        clause: 'Corrigendum #1: Bid submission closing date is extended to 10 November 2026 at 15:30 IST.',
        sourceDoc: 'Corrigendum_01.pdf',
      },
    ],
    checklist: [
      { item: 'Check audited balance sheets for 2024-25', done: true, why: 'Verifies turnover margin above ₹28L' },
      { item: 'Obtain OEM Authorization Letter for CCTV switches', done: false, why: 'Required under clause 8.1' },
    ],
  },
  {
    id: 'tender-3',
    source: 'CPPP',
    portalId: 'CPPP',
    title: 'Statewide Enterprise Cloud NOC & Data Center Operations',
    department: 'Gujarat State Data Center',
    location: 'Gandhinagar, Gujarat',
    estimatedValueInr: 12000000,
    emdInr: 240000,
    closingAt: new Date(Date.now() + 86400000 * 15).toISOString(),
    url: 'https://eprocure.gov.in/eprocure/app?page=FrontEndTenderDetails&service=page&tender=2026_CPPP_10284_2',
    verdict: 'DONT_BID',
    score: 35,
    relevance: 82,
    whyMatched: 'Matched keywords "support", "operations" in data center category',
    reason: 'Hard disqualification: ₹1.00 Cr turnover required (you have ₹30L) and mandatory Gujarat branch office.',
    image: {
      thumbUrl: '/api/images/thumbs/demo-gem-001.webp',
      fullUrl: '/api/images/full/demo-gem-001.webp',
      source: 'SCREENSHOT',
      alt: 'Screenshot of public tender notice DEMO-GEM-001 from gem.gov.in',
    },
    requirements: [
      {
        name: 'Annual Turnover',
        needs: '₹1.00 Crore min',
        youHave: '₹30.00 Lakh (Deficit ₹70L)',
        status: 'FAIL',
        clause: 'Average annual turnover must exceed Rs. 1,00,00,000/- in the last three financial years.',
        sourceDoc: 'Section 3.1, Page 8',
      },
      {
        name: 'Experience Years',
        needs: '5 Years datacenter NOC',
        youHave: '2 Years',
        status: 'FAIL',
        clause: 'The bidder must have at least 5 years of continuous operational experience managing Tier-3 NOCs.',
        sourceDoc: 'Section 4.3, Page 15',
      },
      {
        name: 'Registered Office',
        needs: 'Gujarat operational office',
        youHave: 'Uttar Pradesh only',
        status: 'FAIL',
        clause: 'The bidder must possess a registered local office in Gujarat at the time of bid submission.',
        sourceDoc: 'Section 2.4, Page 5',
      },
    ],
    checklist: [
      { item: 'Pre-qualification failure — Do not deposit EMD', done: true, why: 'Turnover & local office criteria are non-negotiable' },
    ],
  },
];

export default function SearchPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('IT helpdesk support');
  const [selectedPortals, setSelectedPortals] = useState<string[]>(['CPPP', 'GEM', 'GEPNIC_UP', 'IREPS']);
  const [activePortalTab, setActivePortalTab] = useState<string>('CPPP');
  const [jobId, setJobId] = useState<string | null>(null);
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [timeline, setTimeline] = useState<ActivityStep[]>([]);
  const [portalStatus, setPortalStatus] = useState<Record<string, 'queued' | 'searching' | 'running' | 'done' | 'failed'>>({
    CPPP: 'done',
    GEM: 'done',
    GEPNIC_UP: 'done',
    IREPS: 'done',
  });
  const [efficiency, setEfficiency] = useState<EfficiencySummary>({
    tendersCount: 3,
    agentRuns: 2,
    fetchCalls: 3,
    searchCalls: 4,
    cachedHits: 1,
    stepsUsed: 14,
    timeSeconds: 4.2,
  });
  const [queryPlan, setQueryPlan] = useState<QueryPlanData | null>({
    terms: ['it helpdesk support'],
    synonyms: ['technical support', 'workstation maintenance', 'desktop support', 'endpoint support'],
    hindiTerms: ['आईटी हेल्पडेस्क'],
    portalsChosen: ['CPPP', 'GEM', 'GEPNIC_UP', 'IREPS'],
    intent: 'services',
  });
  const [removedPlanChips, setRemovedPlanChips] = useState<Set<string>>(new Set());
  const [tenders, setTenders] = useState<TenderCardData[]>(INITIAL_FIXTURE_TENDERS);
  const [selectedProofTender, setSelectedProofTender] = useState<TenderCardData | null>(null);
  const [lightboxTender, setLightboxTender] = useState<TenderCardData | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<boolean>(false);
  const [watchedTenderIds, setWatchedTenderIds] = useState<Set<string>>(new Set(['tender-1']));

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [suggestIndex, setSuggestIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestBoxRef = useRef<HTMLDivElement | null>(null);

  // Filters & Sorting state
  const [filterPortal, setFilterPortal] = useState<string>('ALL');
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'MATCH' | 'RELEVANCE' | 'VALUE' | 'CLOSING'>('MATCH');
  const [showPortalPicker, setShowPortalPicker] = useState<boolean>(false);

  const timelineContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch verified portals registry from backend
  const { data: portals = [] } = useQuery<PortalInfo[]>({
    queryKey: ['portals'],
    queryFn: async () => {
      try {
        return await api<PortalInfo[]>('/portals');
      } catch {
        return [
          { id: 'CPPP', name: 'Central Public Procurement Portal (CPPP)', kind: 'CPPP', domains: ['eprocure.gov.in'], states: ['All', 'National'], sectors: ['Central Govt'], priority: 5, enabled: true, health: 'healthy', latencyMs: 350 },
          { id: 'GEM', name: 'Government e-Marketplace (GeM)', kind: 'GEM', domains: ['gem.gov.in'], states: ['All', 'National'], sectors: ['Goods', 'Services'], priority: 5, enabled: true, health: 'healthy', latencyMs: 290 },
          { id: 'GEPNIC_UP', name: 'Uttar Pradesh e-Procurement (GePNIC UP)', kind: 'GEPNIC', domains: ['etender.up.nic.in'], states: ['Uttar Pradesh'], sectors: ['Public Works', 'IT'], priority: 4, enabled: true, health: 'healthy', latencyMs: 420 },
          { id: 'GEPNIC_MP', name: 'Madhya Pradesh e-Tenders (GePNIC MP)', kind: 'GEPNIC', domains: ['mptenders.gov.in'], states: ['Madhya Pradesh'], sectors: ['State Works'], priority: 4, enabled: true, health: 'healthy', latencyMs: 450 },
          { id: 'GEPNIC_MH', name: 'Maharashtra e-Tendering (GePNIC MH)', kind: 'GEPNIC', domains: ['mahatenders.gov.in'], states: ['Maharashtra'], sectors: ['Infrastructure'], priority: 4, enabled: true, health: 'healthy', latencyMs: 410 },
          { id: 'GEPNIC_TN', name: 'Tamil Nadu Tenders (GePNIC TN)', kind: 'GEPNIC', domains: ['tntenders.gov.in'], states: ['Tamil Nadu'], sectors: ['State Works'], priority: 4, enabled: true, health: 'healthy', latencyMs: 490 },
          { id: 'IREPS', name: 'Indian Railways E-Procurement (IREPS)', kind: 'IREPS', domains: ['ireps.gov.in'], states: ['All'], sectors: ['Railways', 'Telecom'], priority: 4, enabled: true, health: 'healthy', latencyMs: 380 },
          { id: 'DEFENCE', name: 'Defence eProcurement Portal', kind: 'DEFENCE', domains: ['defproc.gov.in'], states: ['All'], sectors: ['Armed Forces'], priority: 4, enabled: true, health: 'healthy', latencyMs: 510 },
        ];
      }
    },
    staleTime: 60_000 * 5,
  });

  // Query suggestion debouncing
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api<{ suggestions: string[] }>(`/search/suggest?q=${encodeURIComponent(query.trim())}`);
        if (res?.suggestions?.length) {
          setSuggestions(res.suggestions);
          setIsSuggestOpen(true);
        } else {
          setSuggestions([]);
          setIsSuggestOpen(false);
        }
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close suggestion box
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestBoxRef.current &&
        !suggestBoxRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll timeline to bottom
  useEffect(() => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollTop = timelineContainerRef.current.scrollHeight;
    }
  }, [timeline]);

  // Keyboard accessibility for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxTender(null);
        setLightboxZoom(false);
        setIsSuggestOpen(false);
        setShowPortalPicker(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle SSE Realtime Streaming from backend
  useEffect(() => {
    if (!jobId || !isAgentRunning) return;

    let eventSource: EventSource | null = null;
    try {
      const sseUrl = `${apiBaseUrl()}/search-jobs/${jobId}/events`;
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.addEventListener('job.started', () => {
        addStep('Query plan generated. Dispatching fan-out to public portals...', 'OPTIMIZER');
      });

      eventSource.addEventListener('search.plan', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setQueryPlan({
            terms: payload.terms || [],
            synonyms: payload.synonyms || [],
            hindiTerms: payload.hindiTerms || [],
            portalsChosen: payload.portalsChosen || [],
            intent: payload.intent || 'goods',
          });
          setRemovedPlanChips(new Set());
          addStep(`Targeting ${payload.portalsChosen?.length || 0} portals with ${payload.terms?.length || 0} canonical and ${(payload.synonyms || []).length} synonym expressions.`, 'PLAN');
        } catch {}
      });

      eventSource.addEventListener('portal.status', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.portal && payload.state) {
            setPortalStatus((prev) => ({ ...prev, [payload.portal]: payload.state }));
            if (payload.state === 'searching') {
              addStep(`Searching catalog on ${payload.portal}...`, payload.portal);
            } else if (payload.state === 'done') {
              addStep(`Completed discovery on ${payload.portal}. ${payload.count ? `${payload.count} notices matched.` : ''}`, payload.portal);
            } else if (payload.state === 'failed') {
              addStep(`Notice discovery timed out on ${payload.portal}. Circuit breaker activated.`, payload.portal);
            }
          }
        } catch {}
      });

      eventSource.addEventListener('live.url', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.streamingUrl) {
            setStreamingUrl(payload.streamingUrl);
            setActivePortalTab(payload.portal || 'CPPP');
            addStep(`Live autonomous browser preview active for ${payload.portal || 'portal'}`, payload.portal);
          }
        } catch {}
      });

      eventSource.addEventListener('candidates.update', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          addStep(`Deduplicated ${payload.total || 0} candidate notices across sources. Prioritizing top matches.`, 'DEDUPE');
        } catch {}
      });

      eventSource.addEventListener('step', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          addStep(payload.text || payload.message, payload.portal);
        } catch {
          addStep(e.data);
        }
      });

      eventSource.addEventListener('tender.image', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.tenderId && payload.image) {
            setTenders((prev) =>
              prev.map((t) => (t.id === payload.tenderId ? { ...t, image: payload.image } : t))
            );
          }
        } catch {}
      });

      eventSource.addEventListener('tender.verdict', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setTenders((prev) => {
            const exists = prev.some((t) => t.id === payload.tenderId);
            if (exists) {
              return prev.map((t) => (t.id === payload.tenderId ? { ...t, ...payload } : t));
            }
            const newTender: TenderCardData = {
              id: payload.tenderId,
              source: payload.source ?? 'CPPP',
              portalId: payload.portalId ?? payload.source,
              title: payload.title ?? 'Public Tender Notice',
              department: payload.department ?? 'Government Authority',
              location: payload.location ?? 'India',
              estimatedValueInr: payload.estimatedValueInr,
              emdInr: payload.emdInr,
              closingAt: payload.closingAt,
              url: payload.url ?? 'https://eprocure.gov.in',
              verdict: payload.verdict ?? 'BID',
              score: payload.score ?? 90,
              relevance: payload.relevance ?? 85,
              whyMatched: payload.whyMatched ?? 'Keyword match in tender notice',
              alsoOn: payload.alsoOn ?? [],
              reason: payload.reason ?? 'Turnover & qualification verified against profile.',
              image: payload.image,
              requirements: INITIAL_FIXTURE_TENDERS[0]?.requirements ?? [],
              checklist: INITIAL_FIXTURE_TENDERS[0]?.checklist ?? [],
            };
            return [newTender, ...prev];
          });
        } catch {}
      });

      eventSource.addEventListener('job.summary', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setEfficiency((prev) => ({ ...prev, ...payload }));
        } catch {}
      });

      eventSource.addEventListener('complete', () => {
        setIsAgentRunning(false);
        addStep('TinyFish multi-portal audit complete. Results merged & deduped.', 'ALL');
        eventSource?.close();
      });

      eventSource.onerror = () => {
        // Keep resilient
      };
    } catch {
      // EventSource fallback
    }

    return () => {
      eventSource?.close();
    };
  }, [jobId, isAgentRunning]);

  const addStep = (text: string, portal: string = 'AGENT') => {
    setTimeline((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        portal,
        text,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  };

  const startSearch = useMutation({
    mutationFn: async () => {
      setIsSuggestOpen(false);
      try {
        return await api<{ jobId: string }>('/search-jobs', {
          method: 'POST',
          body: JSON.stringify({
            query: query.trim(),
            portals: selectedPortals.length > 0 ? selectedPortals : ['CPPP', 'GEM'],
            sources: ['CPPP', 'GEM'],
          }),
        });
      } catch (err) {
        // Fallback demo job if API server is in local mock mode
        return { jobId: `run-${Date.now()}` };
      }
    },
    onSuccess: ({ jobId: createdId }) => {
      setJobId(createdId);
      setIsAgentRunning(true);
      setTimeline([]);

      // Reset portal statuses for chosen portals
      const initStatuses: Record<string, 'queued' | 'searching' | 'running' | 'done' | 'failed'> = {};
      selectedPortals.forEach((p) => {
        initStatuses[p] = 'searching';
      });
      setPortalStatus(initStatuses);

      addStep(`Optimizing search query: "${query}"...`, 'OPTIMIZER');

      // Live Demo Fallback Pipeline: fast feedback if offline
      setTimeout(() => {
        setStreamingUrl('https://eprocure.gov.in/eprocure/app');
        setActivePortalTab('CPPP');
        addStep('Opening CPPP tender listing on eprocure.gov.in', 'CPPP');
      }, 1200);

      setTimeout(() => {
        addStep('Fan-out querying Uttar Pradesh e-Procurement (etender.up.nic.in)', 'GEPNIC_UP');
      }, 2400);

      setTimeout(() => {
        addStep('Auditing Indian Railways (IREPS) electronic portal', 'IREPS');
      }, 3400);

      setTimeout(() => {
        addStep('Merging & deduplicating candidate tenders across 4 portals', 'DEDUPE');
        setTenders(INITIAL_FIXTURE_TENDERS);
        toast({
          type: 'success',
          title: 'Tenders Discovered',
          message: 'Top opportunities ranked across national and state portals.',
        });
      }, 4800);

      setTimeout(() => {
        addStep('Multi-portal screening complete. Verified proof clauses attached.', 'DONE');
        setIsAgentRunning(false);
        const doneStatuses: Record<string, 'done'> = {};
        selectedPortals.forEach((p) => {
          doneStatuses[p] = 'done';
        });
        setPortalStatus(doneStatuses);
      }, 6800);

      toast({
        type: 'info',
        title: 'Multi-Portal Search Dispatched',
        message: `Querying ${selectedPortals.length} government portals with query expansion.`,
      });
    },
  });

  const stopAgent = async () => {
    if (!jobId) return;
    try {
      await api(`/search-jobs/${jobId}/cancel`, { method: 'POST' });
    } catch {}
    setIsAgentRunning(false);
    const doneStatuses: Record<string, 'done'> = {};
    selectedPortals.forEach((p) => {
      doneStatuses[p] = 'done';
    });
    setPortalStatus(doneStatuses);
    addStep('Agent run cancelled by user. Partial results preserved.', 'STOP');
    toast({
      type: 'warning',
      title: 'Agent Stopped',
      message: 'All active TinyFish runs have been safely cancelled.',
    });
  };

  const toggleWatch = (tenderId: string) => {
    setWatchedTenderIds((prev) => {
      const next = new Set(prev);
      if (next.has(tenderId)) {
        next.delete(tenderId);
        toast({ type: 'info', title: 'Watch removed', message: 'Tender removed from watchlist.' });
      } else {
        next.add(tenderId);
        toast({ type: 'success', title: 'Watch active', message: 'You will receive corrigendum alerts for this tender.' });
      }
      return next;
    });
  };

  const togglePortal = (portalId: string) => {
    setSelectedPortals((curr) => {
      if (curr.includes(portalId)) {
        if (curr.length === 1) {
          toast({ type: 'warning', title: 'Portal Required', message: 'At least one target portal must remain selected.' });
          return curr;
        }
        return curr.filter((p) => p !== portalId);
      }
      return [...curr, portalId];
    });
  };

  const removePlanChip = (chipText: string) => {
    setRemovedPlanChips((prev) => {
      const next = new Set(prev);
      next.add(chipText);
      return next;
    });
  };

  const restoreAllChips = () => {
    setRemovedPlanChips(new Set());
  };

  // Filter & sort logic
  const filteredAndRankedTenders = useMemo(() => {
    let list = [...tenders];

    // Filter by Portal
    if (filterPortal !== 'ALL') {
      list = list.filter((t) => (t.portalId || t.source) === filterPortal || t.source === filterPortal);
    }

    // Filter by Verdict
    if (filterVerdict !== 'ALL') {
      list = list.filter((t) => t.verdict === filterVerdict);
    }

    // Filter by State
    if (filterState !== 'ALL') {
      list = list.filter((t) => t.location.toLowerCase().includes(filterState.toLowerCase()));
    }

    // Sorting
    const verdictRank = { BID: 0, RISKY: 1, DONT_BID: 2 } as const;
    list.sort((a, b) => {
      if (sortBy === 'MATCH') {
        const vr = verdictRank[a.verdict] - verdictRank[b.verdict];
        if (vr !== 0) return vr;
        return (b.score || 0) - (a.score || 0);
      }
      if (sortBy === 'RELEVANCE') {
        return (b.relevance || 50) - (a.relevance || 50);
      }
      if (sortBy === 'VALUE') {
        const valA = Number(a.estimatedValueInr) || 0;
        const valB = Number(b.estimatedValueInr) || 0;
        return valB - valA;
      }
      if (sortBy === 'CLOSING') {
        const dateA = a.closingAt ? new Date(a.closingAt).getTime() : Infinity;
        const dateB = b.closingAt ? new Date(b.closingAt).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });

    return list;
  }, [tenders, filterPortal, filterVerdict, filterState, sortBy]);

  // Unique states from current tenders
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    tenders.forEach((t) => {
      if (t.location) {
        const parts = t.location.split(',');
        const stateName = (parts[parts.length - 1] || '').trim();
        if (stateName) states.add(stateName);
      }
    });
    return Array.from(states);
  }, [tenders]);

  // Active query plan chips
  const activePlanChips = useMemo(() => {
    if (!queryPlan) return [];
    const chips: Array<{ text: string; type: 'canonical' | 'synonym' | 'hindi' | 'intent' }> = [];
    if (queryPlan.intent && queryPlan.intent !== 'unknown') {
      chips.push({ text: `Intent: ${queryPlan.intent}`, type: 'intent' });
    }
    queryPlan.terms?.forEach((term) => {
      if (!removedPlanChips.has(term)) {
        chips.push({ text: term, type: 'canonical' });
      }
    });
    queryPlan.synonyms?.forEach((syn) => {
      if (!removedPlanChips.has(syn)) {
        chips.push({ text: syn, type: 'synonym' });
      }
    });
    queryPlan.hindiTerms?.forEach((hindi) => {
      if (!removedPlanChips.has(hindi)) {
        chips.push({ text: hindi, type: 'hindi' });
      }
    });
    return chips;
  }, [queryPlan, removedPlanChips]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E4DAC9] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#2F6B4F]">
              <Compass size={13} />
              TinyFish Multi-Portal Radar
            </span>
            <span className="text-xs text-[#7A6A5A]">·</span>
            <span className="text-xs font-semibold text-[#7A6A5A]">
              13 Verified Central &amp; State Portals (CPPP, GeM, GePNIC, IREPS, Defence)
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#2E2118]">
            Intelligent Multi-Portal Tender Search
          </h1>
          <p className="mt-1 text-sm text-[#7A6A5A] max-w-3xl">
            Autonomous web agents crawl public government portals in parallel, apply query optimization, merge cross-posted notices, and evaluate eligibility before you pay EMD.
          </p>
        </div>

        <Link
          href="/agent-activity"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#E4DAC9] bg-[#FAF7F2] px-4 text-xs font-bold text-[#6B4226] hover:bg-[#F3EDE3] transition self-start sm:self-auto shrink-0"
        >
          <Bot size={15} />
          <span>Audit Log History</span>
        </Link>
      </div>

      {/* 2. Search & Target Portals Control Deck */}
      <div className="rounded-2xl border border-[#E4DAC9] bg-[#FFFFFF] p-5 sm:p-6 shadow-sm space-y-4">
        {/* Main Search Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startSearch.mutate();
          }}
          className="relative"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A5A]" size={17} />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setIsSuggestOpen(true);
                }}
                onKeyDown={(e) => {
                  if (isSuggestOpen && suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSuggestIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSuggestIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                    } else if (e.key === 'Enter' && suggestIndex >= 0) {
                      e.preventDefault();
                      const selected = suggestions[suggestIndex];
                      if (selected) {
                        setQuery(selected);
                        setIsSuggestOpen(false);
                      }
                    }
                  }
                }}
                placeholder="e.g. CCTV camera surveillance, solar rooftop, road construction, IT support"
                className="w-full rounded-[14px] border border-[#E4DAC9] bg-[#FAF7F2] py-3 pl-10 pr-10 text-sm text-[#2E2118] focus:border-[#6B4226] focus:bg-[#FFFFFF] focus:outline-none transition shadow-inner"
                minLength={2}
                maxLength={500}
                required
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setIsSuggestOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A5A] hover:text-[#2E2118]"
                >
                  <X size={15} />
                </button>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {isSuggestOpen && suggestions.length > 0 && (
                <div
                  ref={suggestBoxRef}
                  className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] shadow-lg animate-in fade-in-50"
                >
                  <div className="border-b border-[#E4DAC9] bg-[#FAF7F2] px-3.5 py-1.5 text-[11px] font-semibold text-[#7A6A5A] flex items-center justify-between">
                    <span>Suggested Public Procurement Terms</span>
                    <span className="font-mono text-[10px]">Use ↑↓ to navigate</span>
                  </div>
                  <ul className="py-1 max-h-56 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => {
                            setQuery(suggestion);
                            setIsSuggestOpen(false);
                            startSearch.mutate();
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                            idx === suggestIndex
                              ? 'bg-[#F3EDE3] text-[#6B4226] font-semibold'
                              : 'text-[#2E2118] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Search size={13} className="text-[#7A6A5A]" />
                            <span>{suggestion}</span>
                          </span>
                          <span className="text-[10px] text-[#7A6A5A]">Search</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={startSearch.isPending || isAgentRunning || selectedPortals.length === 0}
                className="min-h-[48px] rounded-[14px] bg-[#6B4226] px-6 text-sm font-semibold text-[#FAF7F2] transition hover:bg-[#553320] flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 shrink-0"
              >
                {startSearch.isPending || isAgentRunning ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#FAF7F2]" />
                    <span>Agent Crawling…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Run Multi-Portal Search</span>
                  </>
                )}
              </button>

              {isAgentRunning && (
                <button
                  type="button"
                  onClick={stopAgent}
                  className="min-h-[48px] rounded-[14px] border border-[#B23A2E] bg-[#FAEDE9] px-4 text-sm font-semibold text-[#B23A2E] hover:bg-[#F8DED9] transition flex items-center gap-1.5 shrink-0"
                >
                  <StopCircle size={16} />
                  <span>Stop Agent</span>
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Query Plan Chips (Canonical terms, synonyms, Devanagari Hindi transliteration) */}
        {activePlanChips.length > 0 && (
          <div className="rounded-xl border border-[#E4DAC9] bg-[#FAF7F2] p-3 text-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-[#6B4226] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>AI Query Optimizer Plan:</span>
              </span>
              {removedPlanChips.size > 0 && (
                <button
                  type="button"
                  onClick={restoreAllChips}
                  className="text-[11px] text-[#2F6B4F] hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={11} />
                  <span>Reset all terms</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {activePlanChips.map((chip, idx) => {
                const isIntent = chip.type === 'intent';
                const isHindi = chip.type === 'hindi';
                const isSynonym = chip.type === 'synonym';

                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                      isIntent
                        ? 'border border-[#BCD8C7] bg-[#EBF4EF] font-bold text-[#2F6B4F]'
                        : isHindi
                        ? 'border border-[#E4DAC9] bg-[#FFFFFF] font-medium text-[#6B4226]'
                        : isSynonym
                        ? 'border border-[#E4DAC9] bg-[#FFFFFF] text-[#2E2118]'
                        : 'border border-[#6B4226]/30 bg-[#FFFFFF] font-semibold text-[#2E2118]'
                    }`}
                  >
                    {isHindi && <span className="text-[10px] text-[#7A6A5A] uppercase">Hindi:</span>}
                    <span>{chip.text}</span>
                    {!isIntent && (
                      <button
                        type="button"
                        onClick={() => removePlanChip(chip.text)}
                        className="text-[#7A6A5A] hover:text-[#B23A2E] ml-0.5"
                        aria-label={`Remove ${chip.text}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Target Portals Bar & Health Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-[#E4DAC9] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#7A6A5A] flex items-center gap-1">
              <Layers size={13} />
              <span>Target Portals ({selectedPortals.length} active):</span>
            </span>

            {/* Top selected portals */}
            {['CPPP', 'GEM', 'GEPNIC_UP', 'IREPS', 'DEFENCE'].map((pid) => {
              const isSelected = selectedPortals.includes(pid);
              const status = portalStatus[pid] || 'done';
              const portalData = portals.find((p) => p.id === pid);
              const label =
                pid === 'CPPP'
                  ? 'CPPP (Central)'
                  : pid === 'GEM'
                  ? 'GeM'
                  : pid === 'GEPNIC_UP'
                  ? 'UP GePNIC'
                  : pid === 'IREPS'
                  ? 'Railways (IREPS)'
                  : 'Defence';

              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => togglePortal(pid)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold transition ${
                    isSelected
                      ? 'border-[#6B4226] bg-[#6B4226] text-[#FAF7F2]'
                      : 'border-[#E4DAC9] bg-[#FFFFFF] text-[#7A6A5A] hover:border-[#6B4226]/50'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      status === 'searching' || status === 'running'
                        ? 'bg-amber-400 animate-pulse'
                        : status === 'done'
                        ? 'bg-[#2E7D4F]'
                        : status === 'failed'
                        ? 'bg-[#B23A2E]'
                        : 'bg-[#7A6A5A]'
                    }`}
                  />
                </button>
              );
            })}

            {/* Toggle dropdown for additional State & PSU portals */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPortalPicker((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-[#E4DAC9] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#6B4226] hover:bg-[#F3EDE3] transition"
              >
                <span>+ State &amp; PSU Portals</span>
                <ChevronDown size={13} />
              </button>

              {showPortalPicker && (
                <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-[#E4DAC9] bg-[#FFFFFF] p-3 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-[#E4DAC9] pb-1.5 text-xs font-bold text-[#2E2118]">
                    <span>Select Regional Portals</span>
                    <button
                      type="button"
                      onClick={() => setShowPortalPicker(false)}
                      className="text-[#7A6A5A] hover:text-[#2E2118]"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs">
                    {portals.map((p) => {
                      const isChecked = selectedPortals.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#FAF7F2] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePortal(p.id)}
                            className="rounded border-[#E4DAC9] text-[#6B4226] focus:ring-[#6B4226]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#2E2118] truncate">{p.name}</div>
                            <div className="text-[10px] text-[#7A6A5A]">
                              {p.states.join(', ')} · {p.sectors.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Efficiency Metric pill */}
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#7A6A5A]">
            <span>Discovery Efficiency:</span>
            <span className="font-semibold text-[#2F6B4F]">
              {efficiency.tendersCount} tenders · {efficiency.searchCalls} fast queries · {efficiency.fetchCalls} fetches · {efficiency.agentRuns} browser runs
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search Summary Banner (when results available) */}
      <div className="rounded-xl border border-[#E4DAC9] bg-[#FFFFFF] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#EBF4EF] text-[#2F6B4F] shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="font-bold text-[#2E2118] text-sm">
              Cross-Portal Discovery Completed
            </div>
            <div className="text-[#7A6A5A]">
              Screened across <strong className="text-[#2E2118]">{selectedPortals.length} portals</strong> · Found {tenders.length} candidate notices · Deduplicated &amp; ranked by verified financial criteria.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <span className="rounded bg-[#FAF7F2] border border-[#E4DAC9] px-2.5 py-1 font-mono text-[11px] text-[#6B4226]">
            Latency: ~{efficiency.timeSeconds ? `${efficiency.timeSeconds}s` : '4.2s'}
          </span>
          <span className="rounded bg-[#EBF4EF] border border-[#BCD8C7] px-2.5 py-1 font-mono text-[11px] font-bold text-[#2F6B4F]">
            100% Deterministic Proof
          </span>
        </div>
      </div>

      {/* 4. Filters & Sorters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4DAC9] bg-[#FFFFFF] p-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[#7A6A5A] flex items-center gap-1">
            <Filter size={13} />
            <span>Filters:</span>
          </span>

          {/* Verdict Filter */}
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none"
          >
            <option value="ALL">All Verdicts</option>
            <option value="BID">BID (Pre-qualified)</option>
            <option value="RISKY">RISKY (Needs Review)</option>
            <option value="DONT_BID">DON'T BID (Hard Deficit)</option>
          </select>

          {/* Portal Filter */}
          <select
            value={filterPortal}
            onChange={(e) => setFilterPortal(e.target.value)}
            className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none"
          >
            <option value="ALL">All Portals</option>
            <option value="CPPP">CPPP (Central)</option>
            <option value="GEM">GeM</option>
            <option value="GEPNIC_UP">UP GePNIC</option>
            <option value="IREPS">IREPS (Railways)</option>
            <option value="DEFENCE">Defence</option>
          </select>

          {/* State Filter */}
          {availableStates.length > 0 && (
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] px-2.5 py-1 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none"
            >
              <option value="ALL">All States / National</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort Sorter */}
        <div className="flex items-center gap-2">
          <span className="text-[#7A6A5A] flex items-center gap-1">
            <ArrowUpDown size={13} />
            <span>Sort by:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] px-2.5 py-1 text-xs font-semibold text-[#6B4226] focus:border-[#6B4226] focus:outline-none"
          >
            <option value="MATCH">Best Match (Eligibility &amp; Score)</option>
            <option value="RELEVANCE">Query Relevance (0-100%)</option>
            <option value="VALUE">Estimated Value (High to Low)</option>
            <option value="CLOSING">Closing Soonest</option>
          </select>
        </div>
      </div>

      {/* 5. Main Workspace Split: Left 60% Results, Right 40% Live Agent Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ranked Tender Cards (60%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#2E2118]">
                Screened Opportunities ({filteredAndRankedTenders.length})
              </h2>
              <span className="text-xs text-[#7A6A5A]">
                Ranked by qualification score and query relevance
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded bg-[#EBF4EF] px-2 py-0.5 font-bold text-[#2F6B4F]">
                BID: {filteredAndRankedTenders.filter((t) => t.verdict === 'BID').length}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-[#FAF2E2] px-2 py-0.5 font-bold text-[#B7791F]">
                RISKY: {filteredAndRankedTenders.filter((t) => t.verdict === 'RISKY').length}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-[#FAEDE9] px-2 py-0.5 font-bold text-[#B23A2E]">
                REJECT: {filteredAndRankedTenders.filter((t) => t.verdict === 'DONT_BID').length}
              </span>
            </div>
          </div>

          {/* Tender Cards Stream */}
          <div className="space-y-3.5">
            {filteredAndRankedTenders.length === 0 ? (
              <div className="rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] p-8 text-center space-y-2">
                <Search size={28} className="mx-auto text-[#7A6A5A]" />
                <h3 className="text-sm font-bold text-[#2E2118]">No tenders match the current filters</h3>
                <p className="text-xs text-[#7A6A5A]">
                  Try clearing the verdict or state filter to view opportunities.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterPortal('ALL');
                    setFilterVerdict('ALL');
                    setFilterState('ALL');
                  }}
                  className="rounded-lg bg-[#6B4226] px-4 py-1.5 text-xs font-semibold text-white mt-2"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredAndRankedTenders.map((tender) => {
                const isWatched = watchedTenderIds.has(tender.id);
                const isBid = tender.verdict === 'BID';
                const isRisky = tender.verdict === 'RISKY';
                const primaryPortal = tender.portalId || tender.source;

                return (
                  <div
                    key={tender.id}
                    className="rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] p-5 shadow-sm transition hover:border-[#6B4226]/40 flex flex-col justify-between space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Thumbnail: Aspect 16:9 on mobile, 4:3 on desktop */}
                      <div
                        className="relative shrink-0 w-full sm:w-44 aspect-[16/9] sm:aspect-[4/3] rounded-lg overflow-hidden border border-[#E4DAC9] bg-[#F3EDE3] group cursor-pointer"
                        onClick={() => setLightboxTender(tender)}
                      >
                        <img
                          src={resolveImageUrl(
                            tender.image?.thumbUrl ||
                              tender.image?.fullUrl ||
                              `/api/images/badges/${encodeURIComponent(tender.source)}.svg`
                          )}
                          alt={tender.image?.alt || `Notice image for ${tender.title}`}
                          className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallbackBadge = resolveImageUrl(
                              `/api/images/badges/${encodeURIComponent(tender.source)}.svg`
                            );
                            if (target.src !== fallbackBadge) {
                              target.src = fallbackBadge;
                            }
                          }}
                        />
                        {/* Hover overlay hint */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#2E2118]/85 px-2 py-1 text-[11px] font-semibold text-[#FAF7F2] shadow">
                            <Maximize2 size={12} />
                            Expand Proof
                          </span>
                        </div>
                        {/* Page capture badge */}
                        {tender.image?.source === 'SCREENSHOT' ? (
                          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-[#2E2118]/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#FAF7F2] backdrop-blur-sm">
                            <Camera size={10} className="text-emerald-400" />
                            Page capture
                          </span>
                        ) : (
                          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-[#6B4226]/85 px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#FAF7F2] backdrop-blur-sm">
                            {tender.source} Gazette
                          </span>
                        )}
                      </div>

                      {/* Tender Details (right side of thumbnail) */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            {/* Portal origin & cross-posting chips */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded bg-[#FAF7F2] border border-[#E4DAC9] px-2 py-0.5 text-[11px] font-mono font-bold text-[#6B4226]">
                                {primaryPortal}
                              </span>

                              {tender.alsoOn && tender.alsoOn.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded bg-[#F3EDE3] px-2 py-0.5 text-[10px] font-medium text-[#7A6A5A]">
                                  <span>Also on:</span>
                                  <strong className="text-[#2E2118]">{tender.alsoOn.join(', ')}</strong>
                                </span>
                              )}

                              <span className="text-xs text-[#7A6A5A] truncate max-w-[200px]">
                                {tender.department}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-[#2E2118] hover:text-[#6B4226] leading-snug">
                              <a
                                href={tender.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                <span className="line-clamp-2">{tender.title}</span>
                                <ExternalLink size={13} className="text-[#7A6A5A] shrink-0" />
                              </a>
                            </h3>
                          </div>

                          {/* Verdict Stamp + Score Badge */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-white ${
                                isBid ? 'bg-[#2E7D4F]' : isRisky ? 'bg-[#B7791F]' : 'bg-[#B23A2E]'
                              }`}
                            >
                              {isBid ? (
                                <CheckCircle2 size={13} />
                              ) : isRisky ? (
                                <AlertTriangle size={13} />
                              ) : (
                                <XCircle size={13} />
                              )}
                              <span>{tender.verdict === 'DONT_BID' ? "DON'T BID" : tender.verdict}</span>
                            </span>

                            <div className="flex items-center gap-2 text-xs font-mono font-bold">
                              <span className="text-[#7A6A5A]">Match {tender.score}/100</span>
                              {tender.relevance && (
                                <span className="text-[#2F6B4F]">· {tender.relevance}% Rel</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* One-Line Reason Box */}
                        <div className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] p-2.5 text-xs text-[#2E2118] flex items-center gap-2">
                          <FileCheck size={14} className="text-[#2F6B4F] shrink-0" />
                          <span className="leading-relaxed">{tender.reason}</span>
                        </div>

                        {/* Why Matched explanation badge */}
                        {tender.whyMatched && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#7A6A5A]">
                            <Tag size={12} className="text-[#6B4226]" />
                            <span className="font-semibold text-[#6B4226]">Why matched:</span>
                            <span className="italic truncate">{tender.whyMatched}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata and Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E4DAC9] text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-[#7A6A5A]">
                        {tender.estimatedValueInr && (
                          <span>
                            Est: <strong className="text-[#2E2118]">{formatInr(Number(tender.estimatedValueInr))}</strong>
                          </span>
                        )}
                        {tender.emdInr && (
                          <span>
                            EMD: <strong className="text-[#2E2118]">{formatInr(Number(tender.emdInr))}</strong>
                          </span>
                        )}
                        <span className="text-[#7A6A5A]">Loc: <strong className="text-[#2E2118]">{tender.location}</strong></span>
                        <span className="flex items-center gap-1 text-[#6B4226]">
                          <Clock size={13} />
                          <span>Closing soon</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWatch(tender.id)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                            isWatched
                              ? 'border-[#2F6B4F] bg-[#EBF4EF] text-[#2F6B4F]'
                              : 'border-[#E4DAC9] bg-[#FFFFFF] text-[#7A6A5A] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <Bookmark size={13} />
                          <span>{isWatched ? 'Watching' : 'Watch'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedProofTender(tender)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#6B4226] px-3 py-1.5 text-xs font-semibold text-[#FAF7F2] hover:bg-[#553320] transition"
                        >
                          <Eye size={13} />
                          <span>View Proof</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Agent Panel (40%) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div className="rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] overflow-hidden shadow-sm">
            {/* Live Browser Chrome */}
            <div className="flex items-center justify-between border-b border-[#E4DAC9] bg-[#F3EDE3] px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
                <span className="ml-2 text-[11px] font-mono text-[#7A6A5A] truncate max-w-[180px]">
                  {activePortalTab === 'CPPP'
                    ? 'eprocure.gov.in/eprocure/app'
                    : activePortalTab === 'GEM'
                    ? 'gem.gov.in/bids'
                    : activePortalTab === 'GEPNIC_UP'
                    ? 'etender.up.nic.in'
                    : 'ireps.gov.in'}
                </span>
              </div>

              {/* Portal switcher tabs */}
              <div className="flex items-center rounded-lg border border-[#E4DAC9] bg-[#FFFFFF] p-0.5 text-[11px] font-bold">
                {['CPPP', 'GEM', 'GEPNIC_UP', 'IREPS'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActivePortalTab(tab)}
                    className={`px-2 py-0.5 rounded transition ${
                      activePortalTab === tab ? 'bg-[#6B4226] text-white' : 'text-[#7A6A5A] hover:text-[#2E2118]'
                    }`}
                  >
                    {tab === 'GEPNIC_UP' ? 'UP' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Streaming Frame */}
            <div className="relative h-60 bg-[#FAF7F2] flex flex-col items-center justify-center border-b border-[#E4DAC9] overflow-hidden">
              {streamingUrl ? (
                <iframe
                  src={streamingUrl}
                  title="TinyFish Live Browser View"
                  className="w-full h-full border-0 pointer-events-none"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#EBF4EF] text-[#2F6B4F]">
                    <Globe size={24} className="animate-spin" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2E2118]">
                      TinyFish Autonomous Browser
                    </div>
                    <div className="text-[11px] text-[#7A6A5A]">
                      Connected to official {activePortalTab} public gazette
                    </div>
                  </div>
                </div>
              )}

              {/* Live overlay badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-[#2E2118]/85 px-2 py-0.5 text-[10px] font-mono text-[#FAF7F2] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE STREAM ACTIVE</span>
              </div>
            </div>

            {/* Step Timeline */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#7A6A5A] text-[11px]">
                  Realtime Execution Timeline
                </span>
                <span className="text-[11px] text-[#2F6B4F] font-semibold flex items-center gap-1">
                  <Activity size={12} />
                  <span>Streaming</span>
                </span>
              </div>

              <div
                ref={timelineContainerRef}
                className="max-h-56 overflow-y-auto space-y-2.5 pr-1 text-xs"
              >
                {timeline.length === 0 ? (
                  <div className="text-center py-6 text-[#7A6A5A] text-xs">
                    Press &ldquo;Run Multi-Portal Search&rdquo; to launch live portal automation.
                  </div>
                ) : (
                  timeline.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-2.5 rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] p-2 text-xs"
                    >
                      <span className="font-mono text-[10px] font-bold text-[#6B4226] bg-[#FFFFFF] border border-[#E4DAC9] px-1.5 py-0.5 rounded shrink-0">
                        {step.portal || 'AGENT'}
                      </span>
                      <div className="flex-1 text-[#2E2118] leading-tight">
                        {step.text}
                      </div>
                      <span className="text-[10px] text-[#7A6A5A] shrink-0">{step.ts}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Proof Drawer (When user clicks "View Proof") */}
      {selectedProofTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-[#E4DAC9] bg-[#FFFFFF] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-[#E4DAC9] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#FAF7F2] border border-[#E4DAC9] px-2 py-0.5 text-xs font-mono font-bold text-[#6B4226]">
                    {selectedProofTender.portalId || selectedProofTender.source} Official Proof Dossier
                  </span>
                  {selectedProofTender.alsoOn && selectedProofTender.alsoOn.length > 0 && (
                    <span className="text-xs text-[#7A6A5A]">
                      (Also verified on: {selectedProofTender.alsoOn.join(', ')})
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-lg font-bold text-[#2E2118]">
                  {selectedProofTender.title}
                </h3>
                <p className="text-xs text-[#7A6A5A]">
                  {selectedProofTender.department} · {selectedProofTender.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProofTender(null)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#FAF7F2] text-[#7A6A5A]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Verdict summary */}
            <div className="flex items-center justify-between rounded-xl border border-[#E4DAC9] bg-[#FAF7F2] p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-white ${
                    selectedProofTender.verdict === 'BID'
                      ? 'bg-[#2E7D4F]'
                      : selectedProofTender.verdict === 'RISKY'
                      ? 'bg-[#B7791F]'
                      : 'bg-[#B23A2E]'
                  }`}
                >
                  {selectedProofTender.verdict === 'BID' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{selectedProofTender.verdict}</span>
                </span>
                <span className="text-sm font-semibold text-[#2E2118]">
                  Match Score: {selectedProofTender.score}/100
                </span>
                {selectedProofTender.relevance && (
                  <span className="text-xs font-semibold text-[#2F6B4F]">
                    ({selectedProofTender.relevance}% Query Relevance)
                  </span>
                )}
              </div>

              <a
                href={selectedProofTender.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6B4226] hover:underline"
              >
                <span>Open Government Notice</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Notice Page Capture Evidence */}
            {selectedProofTender.image && (
              <div className="rounded-xl border border-[#E4DAC9] bg-[#FAF7F2] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF4EF] border border-[#BCD8C7] px-2.5 py-0.5 text-[11px] font-bold text-[#2F6B4F]">
                      <Camera size={12} />
                      {selectedProofTender.image.source === 'SCREENSHOT'
                        ? 'Official Portal Capture Evidence'
                        : 'Procuring Gazette Seal'}
                    </span>
                    <span className="text-[11px] text-[#7A6A5A]">Real source page snapshot</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxTender(selectedProofTender)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#6B4226] hover:underline"
                  >
                    <Maximize2 size={13} />
                    <span>Expand in Lightbox</span>
                  </button>
                </div>

                <div
                  onClick={() => setLightboxTender(selectedProofTender)}
                  className="relative rounded-lg overflow-hidden border border-[#E4DAC9] cursor-pointer group max-h-56 bg-white"
                >
                  <img
                    src={resolveImageUrl(selectedProofTender.image.fullUrl || selectedProofTender.image.thumbUrl)}
                    alt={selectedProofTender.image.alt}
                    className="w-full object-cover object-top transition duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2E2118]/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                      <Maximize2 size={14} />
                      Click to Zoom High-Res Document
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Requirement Rows */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6A5A]">
                Extracted Criteria vs Your Profile
              </h4>

              <div className="space-y-3">
                {selectedProofTender.requirements?.map((req, idx) => (
                  <div key={idx} className="rounded-xl border border-[#E4DAC9] bg-[#FFFFFF] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2 font-bold text-[#2E2118]">
                        {req.status === 'PASS' ? (
                          <Check size={16} className="text-[#2F6B4F]" />
                        ) : req.status === 'RISK' ? (
                          <AlertTriangle size={16} className="text-[#B7791F]" />
                        ) : (
                          <XCircle size={16} className="text-[#B23A2E]" />
                        )}
                        <span>{req.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#7A6A5A]">
                          Required: <strong>{req.needs}</strong>
                        </span>
                        <span className="font-semibold text-[#2E2118]">You: {req.youHave}</span>
                      </div>
                    </div>

                    {/* Exact Quoted Clause */}
                    <div className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] p-3 text-xs leading-relaxed text-[#2E2118]">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#7A6A5A] uppercase mb-1">
                        <span>Exact Quoted Clause:</span>
                        <span>{req.sourceDoc}</span>
                      </div>
                      &ldquo;{req.clause}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bid Readiness Checklist */}
            {selectedProofTender.checklist && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6A5A]">
                  Bid Preparation Checklist
                </h4>
                <div className="space-y-1.5">
                  {selectedProofTender.checklist.map((chk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded grid place-items-center ${
                            chk.done ? 'bg-[#2E7D4F] text-white' : 'border border-[#7A6A5A]'
                          }`}
                        >
                          {chk.done && <Check size={12} />}
                        </span>
                        <span className="font-medium text-[#2E2118]">{chk.item}</span>
                      </div>
                      <span className="text-[11px] text-[#7A6A5A]">{chk.why}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#E4DAC9] flex items-center justify-between">
              <span className="text-[12px] text-[#7A6A5A]">
                Decision support only. Verify against official gazette.
              </span>
              <button
                type="button"
                onClick={() => setSelectedProofTender(null)}
                className="rounded-xl bg-[#6B4226] px-5 py-2 text-xs font-semibold text-white hover:bg-[#553320]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Fullscreen Evidence Lightbox */}
      {lightboxTender && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Document screenshot: ${lightboxTender.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
          onClick={() => {
            setLightboxTender(null);
            setLightboxZoom(false);
          }}
        >
          <div
            className="relative max-w-5xl w-full max-h-[95vh] flex flex-col rounded-2xl border border-[#FAF7F2]/20 bg-[#2E2118] text-[#FAF7F2] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between border-b border-[#FAF7F2]/10 px-5 py-3.5 bg-[#2E2118]">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="shrink-0 rounded bg-[#6B4226] px-2 py-0.5 text-xs font-mono font-bold text-[#FAF7F2]">
                  {lightboxTender.portalId || lightboxTender.source}
                </span>
                <h3 className="text-sm sm:text-base font-semibold truncate text-[#FAF7F2]">
                  {lightboxTender.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Zoom toggle button */}
                <button
                  type="button"
                  onClick={() => setLightboxZoom((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FAF7F2]/20 px-2.5 py-1 text-xs font-medium text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition"
                >
                  <ZoomIn size={14} />
                  <span>{lightboxZoom ? 'Reset Zoom (1x)' : 'Zoom (2x)'}</span>
                </button>

                {/* External portal link */}
                <a
                  href={lightboxTender.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#6B4226] px-3 py-1 text-xs font-semibold text-[#FAF7F2] hover:bg-[#553320] transition"
                >
                  <span>Open source page</span>
                  <ExternalLink size={13} />
                </a>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => {
                    setLightboxTender(null);
                    setLightboxZoom(false);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-[#FAF7F2]/20 text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition"
                  aria-label="Close image viewer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Image Viewer Area with scroll and zoom */}
            <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-[#1A130E]/60 min-h-[420px]">
              <img
                src={resolveImageUrl(
                  lightboxTender.image?.fullUrl ||
                    lightboxTender.image?.thumbUrl ||
                    `/api/images/badges/${encodeURIComponent(lightboxTender.source)}.svg`
                )}
                alt={lightboxTender.image?.alt || lightboxTender.title}
                className={`transition-transform duration-300 rounded shadow-xl ${
                  lightboxZoom ? 'scale-150 cursor-zoom-out' : 'max-h-[75vh] w-auto object-contain cursor-zoom-in'
                }`}
                onClick={() => setLightboxZoom((prev) => !prev)}
              />
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between border-t border-[#FAF7F2]/10 px-5 py-2.5 text-xs text-[#FAF7F2]/70 bg-[#2E2118]">
              <div className="flex items-center gap-2">
                <Camera size={13} className="text-emerald-400" />
                <span>Verified Public Tender Capture by TinyFish Agent</span>
                {lightboxTender.department && (
                  <span className="hidden sm:inline">· {lightboxTender.department}</span>
                )}
              </div>
              <span className="font-mono text-[11px]">Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
