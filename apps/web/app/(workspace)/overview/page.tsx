'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BellRing,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  Filter,
  IndianRupee,
  MapPin,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { TenderTable } from '../../../components/tender-table';
import { DEMO_TENDERS, DEMO_PROFILE, DEMO_ALERTS, DEMO_AGENT_LOGS } from '../../../lib/data';

const categories = [
  'All Categories',
  'IT Services & Infrastructure Maintenance',
  'Software Development & Cloud Hosting',
  'Civil Construction & Engineering',
  'Facility Management & Security',
  'Electrical & Telecom Works',
  'Educational & AV Technology',
];

const locations = [
  'All Locations',
  'Uttar Pradesh',
  'Delhi NCR',
  'Maharashtra',
  'Gujarat',
  'Karnataka',
  'All India (Central)',
];

const deadlineOptions = [
  'All Deadlines',
  'Next 7 Days (Urgent)',
  'Next 15 Days',
  'Next 30 Days',
  'Over 30 Days',
];

const eligibilityOptions = [
  'All Opportunities',
  'MSME Exemption Applicable',
  'Turnover ≤ ₹50 Lakhs',
  'Experience ≤ 2 Years',
  'Zero EMD for MSEs',
];

export default function OverviewPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedDeadline, setSelectedDeadline] = useState('All Deadlines');
  const [selectedEligibility, setSelectedEligibility] = useState('All Opportunities');
  const [portalSource, setPortalSource] = useState<'ALL' | 'CPPP' | 'GEM'>('ALL');

  // Filter tenders based on the intelligent search bar
  const displayedTenders = useMemo(() => {
    return DEMO_TENDERS.filter((tender) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase();
        const matches =
          tender.title.toLowerCase().includes(q) ||
          tender.department.toLowerCase().includes(q) ||
          tender.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedLocation !== 'All Locations' && !tender.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      if (portalSource !== 'ALL' && tender.source !== portalSource) {
        return false;
      }

      if (selectedDeadline === 'Next 7 Days (Urgent)') {
        const diffDays = (new Date(tender.closingAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      }

      if (selectedEligibility === 'Turnover ≤ ₹50 Lakhs') {
        const turnoverReq = tender.requirements.find((r) => r.type === 'TURNOVER');
        const minTurnover = Number(turnoverReq?.valueJson?.minimumInr || 0);
        if (minTurnover > 5000000) return false;
      }

      if (selectedEligibility === 'MSME Exemption Applicable') {
        const emdReq = tender.requirements.find((r) => r.type === 'EMD');
        if (!emdReq?.valueJson?.msmeExemption) return false;
      }

      return true;
    });
  }, [keyword, selectedCategory, selectedLocation, selectedDeadline, selectedEligibility, portalSource]);

  const scrollToSearch = () => {
    document.getElementById('intelligent-search')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-7">
      {/* 1. Top Greeting Section */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[11px] font-bold text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <ShieldCheck size={13} />
              {DEMO_PROFILE.companyName}
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              Small MSME (Turnover: ₹30L)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            Good morning, Welcome to TenderGuard
          </h1>
          <p className="mt-1 text-sm text-[#6B6259] dark:text-[#9E958A]">
            Your procurement intelligence workspace. Autonomous agents monitor CPPP and GeM portals for you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={scrollToSearch}
            className="btn-primary py-2.5 px-4 text-xs font-bold shadow-sm"
          >
            <Compass size={15} />
            <span>Discover Opportunities</span>
          </button>
          <Link
            href="/agent-activity"
            className="btn-secondary py-2.5 px-3.5 text-xs font-bold"
          >
            <Bot size={15} className="text-[#6B4226] dark:text-[#CCAFA0]" />
            <span>Agent Activity</span>
          </Link>
        </div>
      </div>

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Matched Tenders */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm transition hover:border-[#6B4226]/50 dark:border-[#38312A] dark:bg-[#221D19]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6259] dark:text-[#9E958A]">
              Matched Tenders
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F3EEE6] text-[#6B4226] dark:bg-[#28231E] dark:text-[#CCAFA0]">
              <Compass size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2E2118] dark:text-[#F2EBE1]">24</span>
            <span className="text-xs font-semibold text-[#2F6B4F] dark:text-[#7BB896]">
              +6 new today
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8C8276]">Matching IT services & maintenance profile</p>
        </div>

        {/* KPI 2: Eligible Opportunities */}
        <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-5 shadow-sm transition hover:border-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2F6B4F] dark:text-[#7BB896]">
              Eligible Opportunities
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#FFFFFF] text-[#2F6B4F] shadow-sm dark:bg-[#1A1613] dark:text-[#7BB896]">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2F6B4F] dark:text-[#7BB896]">14</span>
            <span className="text-xs font-bold uppercase tracking-wider bg-[#2F6B4F] text-white px-1.5 py-0.5 rounded text-[10px]">
              BID READY
            </span>
          </div>
          <p className="mt-1 text-xs text-[#3E5C4A] dark:text-[#8CB89C]">
            Meets 100% turnover & experience rules
          </p>
        </div>

        {/* KPI 3: Closing Soon */}
        <div className="rounded-xl border border-[#E8D5B5] bg-[#FAF2E2] p-5 shadow-sm transition hover:border-[#94631A] dark:border-[#524024] dark:bg-[#332817]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#94631A] dark:text-[#DEBA70]">
              Closing Soon
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#FFFFFF] text-[#94631A] shadow-sm dark:bg-[#1A1613] dark:text-[#DEBA70]">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#94631A] dark:text-[#DEBA70]">3</span>
            <span className="text-xs font-semibold text-[#A83832] dark:text-[#DE8F87]">
              Closing &lt;48h
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7A5416] dark:text-[#BFA46B]">
            Requires urgent bid document preparation
          </p>
        </div>

        {/* KPI 4: Tender Updates Detected */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm transition hover:border-[#6B4226]/50 dark:border-[#38312A] dark:bg-[#221D19]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B6259] dark:text-[#9E958A]">
              Tender Updates Detected
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F3EEE6] text-[#6B4226] dark:bg-[#28231E] dark:text-[#CCAFA0]">
              <Radio size={18} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#2E2118] dark:text-[#F2EBE1]">2</span>
            <span className="text-xs font-semibold text-[#2F6B4F] dark:text-[#7BB896]">
              Corrigenda verified
            </span>
          </div>
          <p className="mt-1 text-xs text-[#8C8276]">1 deadline extension · 1 MSME relax addendum</p>
        </div>
      </div>

      {/* 3. Large Intelligent Tender Search Section */}
      <div
        id="intelligent-search"
        className="rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]"
      >
        <div className="flex flex-col gap-1 border-b border-[#E8DED2] pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A]">
          <div>
            <p className="eyebrow text-[10px] text-[#6B4226] dark:text-[#B8977E]">
              Autonomous Discovery Engine
            </p>
            <h2 className="text-lg font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              Find opportunities that match your business.
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B6259] dark:text-[#9E958A]">Portals:</span>
            {(['ALL', 'CPPP', 'GEM'] as const).map((source) => (
              <button
                key={source}
                onClick={() => setPortalSource(source)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  portalSource === source
                    ? 'bg-[#6B4226] text-white shadow-sm'
                    : 'bg-[#F3EEE6] text-[#6B6259] hover:bg-[#EFE8DD] dark:bg-[#28231E] dark:text-[#9E958A]'
                }`}
              >
                {source === 'ALL' ? 'CPPP + GeM' : source}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Search Input Fields */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Field 1: Keyword */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              Keyword / Search Term
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8276]" size={15} />
              <input
                type="text"
                placeholder="e.g. IT support, CCTV AMC"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 pl-9 pr-3 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
              />
            </div>
          </div>

          {/* Field 2: Industry / Category */}
          <div>
            <label className="block text-xs font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              Industry / Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: State / Location */}
          <div>
            <label className="block text-xs font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              State / Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Field 4: Tender Deadline */}
          <div>
            <label className="block text-xs font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              Tender Deadline
            </label>
            <select
              value={selectedDeadline}
              onChange={(e) => setSelectedDeadline(e.target.value)}
              className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
            >
              {deadlineOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Field 5: Minimum Eligibility */}
          <div>
            <label className="block text-xs font-bold text-[#2E2118] mb-1.5 dark:text-[#F2EBE1]">
              Minimum Eligibility
            </label>
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
            >
              {eligibilityOptions.map((elig) => (
                <option key={elig} value={elig}>
                  {elig}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Agent Trigger */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8DED2] pt-3 text-xs dark:border-[#38312A]">
          <div className="flex items-center gap-2 text-[#6B6259] dark:text-[#9E958A]">
            <Filter size={14} className="text-[#6B4226] dark:text-[#B8977E]" />
            <span>Active filters: </span>
            <span className="font-semibold text-[#2E2118] dark:text-[#F2EBE1]">
              {selectedLocation} · {portalSource === 'ALL' ? 'CPPP + GeM' : portalSource} · {selectedEligibility}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {(keyword || selectedLocation !== 'All Locations' || selectedDeadline !== 'All Deadlines' || selectedEligibility !== 'All Opportunities') && (
              <button
                onClick={() => {
                  setKeyword('');
                  setSelectedLocation('All Locations');
                  setSelectedDeadline('All Deadlines');
                  setSelectedEligibility('All Opportunities');
                  setSelectedCategory('All Categories');
                  setPortalSource('ALL');
                }}
                className="text-xs font-semibold text-[#A83832] hover:underline"
              >
                Reset filters
              </button>
            )}
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6B4226] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#52311A] transition"
            >
              <Sparkles size={13} />
              <span>Run TinyFish Agent Scan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Tender Opportunity Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              Live Tender Opportunities
            </h3>
            <p className="text-xs text-[#6B6259] dark:text-[#9E958A]">
              Screened deterministically against your MSME turnover, location, and past experience credentials.
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-[#6B4226] hover:underline dark:text-[#B8977E] flex items-center gap-1"
          >
            <span>Full Search Portal</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <TenderTable tenders={displayedTenders} />
      </div>

      {/* 5. Bottom Agent & Corrigendum Quick Intelligence */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Left: TinyFish Agent Activity Snapshot */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#EBF4EF] text-[#2F6B4F] dark:bg-[#202E26] dark:text-[#7BB896]">
                <Bot size={17} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  TinyFish Agent Activity
                </h4>
                <p className="text-[10px] text-[#8C8276]">Crawling public procurement portals</p>
              </div>
            </div>
            <Link
              href="/agent-activity"
              className="text-xs font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
            >
              View live feed →
            </Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {DEMO_AGENT_LOGS.slice(2, 6).map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2.5 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
              >
                <span className="rounded bg-[#6B4226] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  {log.step}
                </span>
                <p className="flex-1 text-[11px] text-[#2E2118] dark:text-[#F2EBE1] line-clamp-2">
                  {log.detail}
                </p>
                <span className="text-[10px] text-[#8C8276] whitespace-nowrap">
                  {new Date(log.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Corrigenda Radar */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FAF2E2] text-[#94631A] dark:bg-[#332817] dark:text-[#DEBA70]">
                <Radio size={17} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  Corrigendum Radar
                </h4>
                <p className="text-[10px] text-[#8C8276]">Deadline & clause changes detected</p>
              </div>
            </div>
            <Link
              href="/monitoring"
              className="text-xs font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
            >
              Open radar →
            </Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {DEMO_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg border border-[#E8D5B5] bg-[#FAF2E2] p-3 text-xs dark:border-[#524024] dark:bg-[#332817]"
              >
                <div className="flex items-center justify-between font-bold text-[#94631A] dark:text-[#DEBA70]">
                  <span className="flex items-center gap-1.5">
                    <BellRing size={13} />
                    {alert.changeType === 'DEADLINE' ? 'Deadline Extension Detected' : 'Turnover Clause Relaxed'}
                  </span>
                  <span className="text-[10px] text-[#8C8276]">
                    {new Date(alert.sentAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-[#2E2118] dark:text-[#F2EBE1] line-clamp-1">
                  {alert.tender.title}
                </p>
                <p className="mt-1 text-[11px] text-[#7A5416] dark:text-[#BFA46B]">
                  {alert.changeType === 'DEADLINE'
                    ? 'Submission window extended to 10 November 2026 15:30 IST.'
                    : 'MSME turnover requirement lowered from ₹25L to ₹15L.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

