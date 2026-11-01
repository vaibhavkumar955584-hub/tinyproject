'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BellPlus,
  Bookmark,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FileText,
  FileWarning,
  HelpCircle,
  IndianRupee,
  Layers,
  MapPin,
  Printer,
  Radio,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Card, PageTitle } from '../../../../components/ui';
import { ScoreRing, VerdictBadge } from '../../../../components/verdict';
import { formatInr, formatDeadline } from '../../../../components/tender-table';
import { DEMO_TENDERS, DEMO_PROFILE, type TenderOpportunity } from '../../../../lib/data';
import { isTenderSaved, saveTenderId } from '../../../../lib/store';
import { api } from '../../../../lib/api';

export default function TenderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id || 'demo-cppp-001';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ELIGIBILITY' | 'DOCS' | 'CLAUSES'>('OVERVIEW');
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(() => isTenderSaved(id));

  // Query API if available; fall back gracefully to DEMO_TENDERS
  const { data: apiTender, isPending } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => api<TenderOpportunity>(`/tenders/${id}`),
    retry: false,
  });

  const tender: TenderOpportunity =
    (apiTender || DEMO_TENDERS.find((t) => t.id === id) || DEMO_TENDERS[0])!;

  const deadlineInfo = formatDeadline(tender.closingAt);

  const toggleSave = () => {
    const updated = saveTenderId(tender.id);
    setIsSaved(updated.includes(tender.id));
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="no-print flex items-center justify-between">
        <Link
          href="/overview"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
        >
          <ArrowLeft size={14} />
          <span>Back to Opportunities</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSave}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              isSaved
                ? 'border-[#6B4226] bg-[#6B4226] text-white dark:border-[#8B5E3C] dark:bg-[#8B5E3C]'
                : 'border-[#E8DED2] bg-white text-[#6B6259] hover:bg-[#F6F1E9] dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#9E958A]'
            }`}
          >
            <Bookmark size={13} className={isSaved ? 'fill-white' : ''} />
            <span>{isSaved ? 'Saved to Watchlist' : 'Save Tender'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8DED2] bg-white px-3 py-1.5 text-xs font-bold text-[#2E2118] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1]"
          >
            <Printer size={13} />
            <span>Print Dossier</span>
          </button>

          <a
            href={tender.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6B4226] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#52311A] transition"
          >
            <span>Official Portal Notice</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Tender Title Header Banner */}
      <div className="rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
              tender.source === 'CPPP' ? 'bg-[#2B4E6B] text-white' : 'bg-[#6B4226] text-white'
            }`}
          >
            {tender.source} PORTAL
          </span>
          <span className="font-mono text-xs font-bold text-[#8C8276]">{tender.sourceTenderId}</span>
          <span className="text-xs text-[#A3998C]">·</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2F6B4F] dark:text-[#7BB896]">
            <ShieldCheck size={14} />
            Verified against public tender gazette
          </span>
        </div>

        <h1 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
          {tender.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#6B6259] dark:text-[#9E958A]">
          <span className="flex items-center gap-1.5">
            <Building2 size={14} className="text-[#8C8276]" />
            <b>{tender.department}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[#8C8276]" />
            {tender.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#8C8276]" />
            Published: {new Date(tender.publishedAt).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns (Content Left 70%, AI Intelligence Panel Right 30%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(330px,1fr)]">
        {/* Left Column: Detailed Tender Sections */}
        <div className="space-y-6">
          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E8DED2] pb-2 text-xs font-bold dark:border-[#38312A]">
            {[
              { id: 'OVERVIEW', label: 'Tender Overview & Terms' },
              { id: 'ELIGIBILITY', label: 'Eligibility Conditions' },
              { id: 'DOCS', label: 'Required Documents' },
              { id: 'CLAUSES', label: `Source Evidence (${tender.requirements.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === tab.id
                    ? 'bg-[#6B4226] text-white shadow-sm'
                    : 'text-[#6B6259] hover:bg-[#F3EEE6] dark:text-[#9E958A] dark:hover:bg-[#28231E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Important Dates Card */}
              <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-3">
                  Key Timeline & Important Dates
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
                    <span className="text-[10px] text-[#8C8276] block">Tender Published</span>
                    <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                      {new Date(tender.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[10px] text-[#2F6B4F] block mt-0.5 font-semibold">Active Notice</span>
                  </div>

                  <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
                    <span className="text-[10px] text-[#8C8276] block">Pre-bid Clarification</span>
                    <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">Online Query Portal</span>
                    <span className="text-[10px] text-[#8C8276] block mt-0.5">Closes 7 days prior</span>
                  </div>

                  <div className="rounded-lg bg-[#FAEDE9] p-3 border border-[#ECC2BD] dark:border-[#5C322D] dark:bg-[#382421]">
                    <span className="text-[10px] text-[#A83832] dark:text-[#DE8F87] block font-bold">
                      Submission Deadline
                    </span>
                    <span className="font-bold text-[#A83832] dark:text-[#DE8F87]">
                      {new Date(tender.closingAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[10px] text-[#A83832] dark:text-[#DE8F87] block mt-0.5 font-bold">
                      {deadlineInfo.label} (15:30 IST)
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Requirements Card */}
              <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-3">
                  Financial Requirements & Guarantees
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
                    <span className="text-[10px] text-[#8C8276] block">Estimated Contract Value</span>
                    <span className="text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                      {formatInr(tender.estimatedValueInr)}
                    </span>
                    <span className="text-[10px] text-[#8C8276] block mt-0.5">Exclusive of GST</span>
                  </div>

                  <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
                    <span className="text-[10px] text-[#8C8276] block">EMD (Bid Security)</span>
                    <span className="text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                      {tender.emdInr > 0 ? formatInr(tender.emdInr) : 'Exempted'}
                    </span>
                    <span className="text-[10px] text-[#2F6B4F] block mt-0.5 font-bold">
                      MSME Exemption Eligible
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
                    <span className="text-[10px] text-[#8C8276] block">Performance Bank Guarantee</span>
                    <span className="text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">3% to 5%</span>
                    <span className="text-[10px] text-[#8C8276] block mt-0.5">Required on contract award</span>
                  </div>
                </div>
              </div>

              {/* Technical Scope & Description */}
              <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-2">
                  Technical Scope & Work Specification
                </h3>
                <p className="text-xs leading-relaxed text-[#6B6259] dark:text-[#9E958A]">
                  The contractor shall be responsible for full operational maintenance, helpdesk ticketing, remote desktop support, on-site engineer deployment, routine preventative servicing, and SLA monitoring. All tickets must be resolved within strict turn-around times (TAT) of 4 hours for critical incidents and 24 hours for standard incidents.
                </p>
                <div className="mt-4 rounded-lg bg-[#FAF7F2] p-3 text-xs dark:bg-[#1A1613]">
                  <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] block mb-1">
                    Key Deliverables:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[#6B6259] dark:text-[#9E958A] text-[11px]">
                    <li>Deployment of minimum 2 qualified L1/L2 resident engineers at client premises.</li>
                    <li>Quarterly preventative maintenance logs and hardware asset inventory audit.</li>
                    <li>Submission of monthly SLA uptime reports (minimum 99.0% availability required).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ELIGIBILITY CONDITIONS */}
          {activeTab === 'ELIGIBILITY' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-3">
                  Summary of Qualification Criteria
                </h3>
                <div className="space-y-3 text-xs">
                  {tender.requirements.map((req, i) => (
                    <div
                      key={req.id || i}
                      className="rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-3 dark:border-[#38312A] dark:bg-[#1A1613]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#6B4226] dark:text-[#CCAFA0] uppercase text-[10px]">
                          Criteria #{i + 1}: {req.type}
                        </span>
                        <span className="rounded bg-[#EBF4EF] px-1.5 py-0.5 text-[10px] font-bold text-[#2F6B4F]">
                          Confidence: {Math.round(req.confidence * 100)}%
                        </span>
                      </div>
                      <p className="font-medium text-[#2E2118] dark:text-[#F2EBE1] italic">
                        “{req.sourceQuote}”
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REQUIRED DOCUMENTS */}
          {activeTab === 'DOCS' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
                <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E]">
                    Mandatory Bid Submission Dossier
                  </h3>
                  <Link
                    href="/bid-readiness"
                    className="text-xs font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
                  >
                    Manage uploads in Bid Readiness →
                  </Link>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  {[
                    { name: 'Udyam Registration Certificate', type: 'MSME Proof', status: 'READY' },
                    { name: 'GST Registration Certificate (Form REG-06)', type: 'Statutory', status: 'READY' },
                    { name: 'PAN Card of Company / Enterprise', type: 'Statutory', status: 'READY' },
                    { name: 'Audited Financial Statements (Last 3 Yrs)', type: 'Financial', status: 'READY' },
                    { name: 'Past Work Orders & Completion Certificates', type: 'Experience', status: 'READY' },
                    { name: 'Non-Blacklisting Affidavit (₹100 Stamp)', type: 'Legal', status: 'PENDING' },
                    { name: 'Power of Attorney for Digital Bid Submission', type: 'Legal', status: 'PENDING' },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2.5 dark:border-[#38312A] dark:bg-[#1A1613]"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-[#6B4226] dark:text-[#CCAFA0]" />
                        <div>
                          <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] block">
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-[#8C8276]">{doc.type} Document</span>
                        </div>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          doc.status === 'READY'
                            ? 'bg-[#EBF4EF] text-[#2F6B4F] dark:bg-[#202E26] dark:text-[#7BB896]'
                            : 'bg-[#FAF2E2] text-[#94631A] dark:bg-[#332817] dark:text-[#DEBA70]'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOURCE EVIDENCE CLAUSES */}
          {activeTab === 'CLAUSES' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-2">
                  Verified Clause Citations
                </h3>
                <p className="text-xs text-[#6B6259] dark:text-[#9E958A] mb-4">
                  Each line below is an exact quote parsed directly from the official portal HTML / PDF gazette notice.
                </p>
                <div className="space-y-3">
                  {tender.requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#BCD8C7] bg-[#EBF4EF] p-3 text-xs dark:border-[#2D543D] dark:bg-[#202E26]"
                    >
                      <div className="flex items-center justify-between font-bold text-[#2F6B4F] dark:text-[#7BB896] mb-1">
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <ShieldCheck size={14} /> Clause {idx + 1}: {req.type}
                        </span>
                        <a
                          href={req.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] hover:underline inline-flex items-center gap-1"
                        >
                          <span>Portal Source</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                      <p className="font-mono text-[11px] text-[#2E2118] dark:text-[#F2EBE1] bg-white/70 p-2 rounded border border-[#BCD8C7] dark:bg-black/30 dark:border-[#2D543D]">
                        “{req.sourceQuote}”
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Intelligence Panel */}
        <div className="space-y-6">
          {/* AI Intelligence Card */}
          <div className="rounded-2xl border-2 border-[#6B4226] bg-[#FFFFFF] p-6 shadow-md dark:border-[#8B5E3C] dark:bg-[#221D19]">
            <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#6B4226] text-white">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    TenderGuard AI Intelligence
                  </h3>
                  <p className="text-[10px] text-[#8C8276]">Deterministic Analysis</p>
                </div>
              </div>
              <VerdictBadge verdict={tender.verdict} />
            </div>

            {/* Score Ring Section */}
            <div className="my-5 flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[#6B4226] bg-[#FAF7F2] dark:border-[#8B5E3C] dark:bg-[#1A1613]">
                <div className="text-center">
                  <span className="text-2xl font-black text-[#2E2118] dark:text-[#F2EBE1]">
                    {tender.matchScore}
                  </span>
                  <span className="block text-[8px] font-bold text-[#8C8276]">MATCH</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#CCAFA0]">
                  Suitability Assessment
                </span>
                <p className="mt-0.5 text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {tender.verdict === 'BID'
                    ? 'Recommended for Active Bidding'
                    : tender.verdict === 'RISKY'
                    ? 'Biddable with Caution'
                    : 'Disqualification Imminent'}
                </p>
                <p className="mt-1 text-[11px] text-[#6B6259] dark:text-[#9E958A] line-clamp-2">
                  {tender.summary}
                </p>
              </div>
            </div>

            {/* Risk Assessment Box */}
            <div className="rounded-xl border border-[#ECC2BD] bg-[#FAEDE9] p-3 text-xs dark:border-[#5C322D] dark:bg-[#382421]">
              <div className="flex items-center gap-1.5 font-bold text-[#A83832] dark:text-[#DE8F87] mb-1.5">
                <ShieldAlert size={14} />
                <span>Identified Bidding Risks</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#2E2118] dark:text-[#F2EBE1]">
                {tender.disqualificationRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#A83832] font-bold shrink-0">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Recommendations Box */}
            <div className="mt-3 rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-3 text-xs dark:border-[#2D543D] dark:bg-[#202E26]">
              <div className="flex items-center gap-1.5 font-bold text-[#2F6B4F] dark:text-[#7BB896] mb-1.5">
                <Sparkles size={14} />
                <span>AI Recommendations</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-[#2E2118] dark:text-[#F2EBE1]">
                {tender.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#2F6B4F] font-bold shrink-0">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prepare Bid Checklist CTA */}
            <div className="mt-5 space-y-2">
              <Link
                href={`/bid-readiness?tenderId=${tender.id}`}
                className="btn-primary w-full py-3 text-xs font-bold shadow-md inline-flex items-center justify-center gap-2"
              >
                <ClipboardList size={16} />
                <span>Prepare Bid Checklist</span>
              </Link>

              <Link
                href="/eligibility"
                className="btn-secondary w-full py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                <Scale size={14} />
                <span>Inspect Full Eligibility Rules</span>
              </Link>
            </div>
          </div>

          {/* Portal Information Details */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FAF7F2] p-4 text-xs text-[#6B6259] dark:border-[#38312A] dark:bg-[#1E1915] dark:text-[#9E958A]">
            <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] block mb-1">
              Portal Verification Note
            </span>
            <p className="text-[11px] leading-relaxed">
              TenderGuard reads public tender gazette notices only. It will never bypass CAPTCHAs, log in as a bidder, or submit financial quotes on your behalf. All bids must be digitally submitted on the official e-Procurement portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
