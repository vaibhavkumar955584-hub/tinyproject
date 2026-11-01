'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  X,
  XCircle,
  AlertTriangle,
  FileCheck,
  Link as LinkIcon,
  ShieldOff,
  ShieldCheck,
  ExternalLink,
  Plus,
  Minus,
  Loader2,
  Home,
  Bookmark,
  Bell,
} from 'lucide-react';

interface ScenarioRow {
  name: string;
  needs: string;
  youHave: string;
  status: 'PASS' | 'RISK' | 'FAIL';
  clause: string;
  sourceDoc: string;
}

interface Scenario {
  id: string;
  name: string;
  title: string;
  verdict: 'BID' | 'RISKY' | "DON'T BID";
  score: number;
  rows: ScenarioRow[];
}

const scenarios: Scenario[] = [
  {
    id: 'it-helpdesk',
    name: 'IT Helpdesk',
    title: 'Managed IT Helpdesk & Endpoint Support Services',
    verdict: 'BID',
    score: 95,
    rows: [
      {
        name: 'Annual Turnover',
        needs: '₹15 Lakh min',
        youHave: '₹30 Lakh',
        status: 'PASS',
        clause: 'The bidder shall have average annual turnover of at least Rs. 15 lakh during the last three financial years.',
        sourceDoc: 'Section 3.1, Page 12',
      },
      {
        name: 'Experience',
        needs: '1 Year min',
        youHave: '2 Years',
        status: 'PASS',
        clause: 'The bidder shall have at least 1 year of relevant IT services experience.',
        sourceDoc: 'Section 4.2, Page 16',
      },
      {
        name: 'EMD Security',
        needs: '₹50,000 (Exempt)',
        youHave: 'Udyam Small MSME',
        status: 'PASS',
        clause: 'Micro and Small Enterprises registered under Udyam are exempted from EMD deposit.',
        sourceDoc: 'Clause 7.1, Page 22',
      },
    ],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    title: 'Annual Maintenance for LAN, Fiber & CCTV Surveillance',
    verdict: 'RISKY',
    score: 78,
    rows: [
      {
        name: 'Annual Turnover',
        needs: '₹28 Lakh min',
        youHave: '₹30 Lakh (tight)',
        status: 'RISK',
        clause: 'The bidder shall have average annual turnover of at least Rs. 28 lakh during the last three financial years.',
        sourceDoc: 'Section 3.2, Page 14',
      },
      {
        name: 'Experience',
        needs: '2 Years min',
        youHave: '2 Years',
        status: 'PASS',
        clause: 'The bidder shall have at least 2 years of relevant experience in enterprise networking.',
        sourceDoc: 'Section 4.1, Page 19',
      },
      {
        name: 'Submission Deadline',
        needs: 'Corrigendum #1',
        youHave: 'Moved to 10 Nov',
        status: 'RISK',
        clause: 'Corrigendum #1: Bid submission closing date is extended to 10 November 2026 at 15:30 IST.',
        sourceDoc: 'Corrigendum-01.pdf, Page 1',
      },
    ],
  },
  {
    id: 'cloud-noc',
    name: 'Cloud NOC',
    title: 'Statewide Enterprise Cloud NOC & Data Center Operations',
    verdict: "DON'T BID",
    score: 35,
    rows: [
      {
        name: 'Annual Turnover',
        needs: '₹1.00 Crore min',
        youHave: '₹30 Lakh (Deficit ₹70L)',
        status: 'FAIL',
        clause: 'The bidder shall have average annual turnover of at least Rs. 1 crore during the last three financial years.',
        sourceDoc: 'Section 3.1, Page 8',
      },
      {
        name: 'Experience',
        needs: '5 Years min',
        youHave: '2 Years',
        status: 'FAIL',
        clause: 'The bidder shall have at least 5 years of relevant enterprise network experience.',
        sourceDoc: 'Section 4.3, Page 15',
      },
      {
        name: 'Registered Office',
        needs: 'Gujarat state office',
        youHave: 'Uttar Pradesh only',
        status: 'FAIL',
        clause: 'The bidder shall maintain a registered operational office in Gujarat.',
        sourceDoc: 'General Terms, Page 4',
      },
    ],
  },
];

const faqs = [
  {
    q: 'How are eligibility checks evaluated?',
    a: 'Requirements are compared mathematically to your profile numbers. If an MSME relaxation is stated in the tender, it is applied with source proof.',
  },
  {
    q: 'Does TenderGuard bypass CAPTCHAs or submit bids?',
    a: 'No. The agent reads only public procurement pages. It never signs in as a bidder or submits bids on your behalf.',
  },
  {
    q: 'How do corrigendum alerts work?',
    a: 'Watched tenders are checked periodically. If a deadline moves or a requirement changes, you receive a change alert with a diff.',
  },
];

export default function HomePage() {
  // Hero looping entrance states (respecting prefers-reduced-motion)
  const [animStep, setAnimStep] = useState(0);

  // Live demo state
  const [activeScenario, setActiveScenario] = useState<Scenario>(scenarios[0]!);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Score ring animation circle setup
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeScenario.score / 100) * circumference;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimStep(3);
      return;
    }

    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;

    const runLoop = () => {
      setAnimStep(0);
      t1 = setTimeout(() => setAnimStep(1), 1400);
      t2 = setTimeout(() => setAnimStep(2), 2800);
      t3 = setTimeout(() => setAnimStep(3), 4200);
    };

    runLoop();
    const interval = setInterval(runLoop, 6500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(interval);
    };
  }, []);

  const activeRow = activeScenario.rows[selectedRowIndex] ?? activeScenario.rows[0]!;

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] text-[#2E2118] selection:bg-[#6B4226]/15 font-sans overflow-x-hidden">
      {/* 3% Subtle Paper Grain Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-multiply bg-[radial-gradient(#2E2118_1px,transparent_1px)] [background-size:16px_16px]"
      />

      {/* 1. NAV */}
      <header className="sticky top-0 z-40 border-b border-[#E4DAC9] bg-[#FAF7F2]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[#6B4226] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] rounded-lg"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#6B4226] text-[#FAF7F2]">
              <ShieldCheck size={18} />
            </span>
            <span className="text-base font-semibold tracking-tight text-[#2E2118]">
              TenderGuard AI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium text-[#7A6A5A]">
            <a href="#demo" className="hover:text-[#2E2118] transition">
              Demo
            </a>
            <a href="#how-it-works" className="hover:text-[#2E2118] transition">
              How it works
            </a>
            <a href="#faq" className="hover:text-[#2E2118] transition">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex min-h-[48px] items-center px-3 text-[15px] font-semibold text-[#7A6A5A] hover:text-[#2E2118] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] rounded-xl"
            >
              Sign in
            </Link>
            <Link
              href="/overview"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-[#6B4226] px-5 text-[15px] font-semibold text-[#FAF7F2] transition hover:bg-[#553320] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] focus-visible:ring-offset-2"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative mx-auto max-w-6xl px-5 py-[72px] lg:py-[120px] sm:px-8">
        {/* Faint 24px dot grid behind hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#E4DAC9_1.25px,transparent_1.25px)] [background-size:24px_24px] opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"
        />

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="font-serif text-[42px] sm:text-[56px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#2E2118]">
              Know which tenders will reject you.
            </h1>

            <p className="text-base sm:text-[17px] sm:leading-[28px] text-[#7A6A5A] font-normal">
              Before you pay the EMD.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/overview"
                className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-[#6B4226] px-6 text-base font-semibold text-[#FAF7F2] transition hover:bg-[#553320] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] focus-visible:ring-offset-2"
              >
                Try the live demo
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[48px] items-center gap-1.5 text-base font-semibold text-[#6B4226] hover:text-[#553320] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] rounded-lg px-2"
              >
                <span>See how it works</span>
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-[13px] text-[#7A6A5A]">
                Public pages only. Never submits a bid.
              </p>

              {/* Source Marks Row */}
              <div className="flex items-center gap-2 pt-1 text-[13px] text-[#7A6A5A]">
                <span className="uppercase tracking-[0.08em] font-medium text-[11px] sm:text-[12px]">
                  Reads public tender pages from
                </span>
                <span className="font-semibold text-[#2E2118] px-2 py-0.5 rounded border border-[#E4DAC9] bg-[#FFFFFF] text-[12px]">
                  CPPP
                </span>
                <span className="font-semibold text-[#2E2118] px-2 py-0.5 rounded border border-[#E4DAC9] bg-[#FFFFFF] text-[12px]">
                  GeM
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Browser Window Frame with Floating Verdict */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] overflow-hidden">
              {/* Browser Header Bar */}
              <div className="flex items-center gap-2 border-b border-[#E4DAC9] bg-[#F3EDE3] px-3.5 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
                </div>
                <div className="ml-2 flex-1 rounded-md border border-[#E4DAC9] bg-[#FFFFFF] px-2.5 py-0.5 text-[11px] font-mono text-[#7A6A5A] truncate">
                  eprocure.gov.in/eprocure/app?page=FrontEndTenderDetails
                </div>
              </div>

              {/* Tender Notice Document Content */}
              <div className="p-5 text-left space-y-4">
                <div className="border-b border-[#E4DAC9] pb-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7A6A5A]">
                    Central Public Procurement Portal
                  </div>
                  <div className="mt-0.5 text-xs font-mono text-[#7A6A5A]">
                    Tender ID: 2026_CPPP_89210_1
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-bold tracking-[0.08em] text-[#7A6A5A]">
                    Clause 3.1 &mdash; Financial Capacity
                  </span>
                  <div className="rounded-lg border border-[#E4DAC9] bg-[#FAF7F2] p-3 text-[14px] sm:text-[15px] leading-relaxed text-[#2E2118]">
                    <span>The bidder shall demonstrate </span>
                    <span
                      className={`transition-all duration-700 rounded px-1 ${
                        animStep >= 1
                          ? 'bg-[#DDE9DF] text-[#2E2118] font-medium'
                          : 'bg-transparent text-[#2E2118]'
                      }`}
                    >
                      average annual turnover of Rs. 50 lakh in the last 3 years.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[12px] text-[#7A6A5A] pt-1">
                  <span>Document: Tender_Notice_Vol_1.pdf</span>
                  <span>Page 2 of 48</span>
                </div>
              </div>
            </div>

            {/* Overlapping Floating Verdict Card */}
            <div
              className={`absolute -bottom-6 sm:-bottom-8 -right-2 sm:-right-4 w-[90%] sm:w-[86%] rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] p-4 shadow-[0_12px_40px_rgba(46,33,24,0.08)] transition-all duration-500 ${
                animStep >= 2
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#B23A2E] px-2.5 py-1 text-xs font-bold text-white tracking-wide">
                  <XCircle size={14} />
                  <span>DON&apos;T BID</span>
                </span>
                <span className="text-[11px] font-mono text-[#7A6A5A]">
                  Disqualification risk
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold text-[#2E2118]">
                Needs ₹50L. You have ₹30L.
              </div>

              <div
                className={`mt-2.5 pt-2 border-t border-[#E4DAC9] flex items-center justify-between text-[12px] transition-opacity duration-300 ${
                  animStep >= 3 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <a
                  href="#demo"
                  className="inline-flex items-center gap-1 font-semibold text-[#6B4226] hover:underline"
                >
                  <span>Source: CPPP page 2</span>
                  <ExternalLink size={12} />
                </a>
                <span className="text-[#2F6B4F] font-semibold flex items-center gap-1">
                  <Check size={12} />
                  <span>Verified clause</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRUST BAR */}
      <section className="border-y border-[#E4DAC9] bg-[#FFFFFF] py-4">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E4DAC9] text-center">
            <div className="flex items-center justify-center gap-2.5 py-2.5 md:py-0 md:px-6 text-[14px] text-[#7A6A5A]">
              <FileCheck size={16} className="text-[#2F6B4F] shrink-0" />
              <span>2 portals: CPPP and GeM</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-2.5 md:py-0 md:px-6 text-[14px] text-[#7A6A5A]">
              <LinkIcon size={16} className="text-[#2F6B4F] shrink-0" />
              <span>Every claim links to its source clause</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 py-2.5 md:py-0 md:px-6 text-[14px] text-[#7A6A5A]">
              <ShieldOff size={16} className="text-[#6B4226] shrink-0" />
              <span>Never submits a bid, by design</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE DEMO */}
      <section id="demo" className="mx-auto max-w-6xl px-5 py-[72px] lg:py-[120px] sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-[40px] sm:leading-[46px] font-semibold tracking-tight text-[#2E2118]">
            Try it on a sample profile.
          </h2>
          <p className="mt-2 text-base sm:text-[17px] sm:leading-[28px] text-[#7A6A5A]">
            ₹30 lakh turnover, 2 years, Small MSME.
          </p>
        </div>

        {/* Live Demo Browser Frame */}
        <div className="mt-10 mx-auto max-w-4xl rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] overflow-hidden">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between border-b border-[#E4DAC9] bg-[#F3EDE3] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAC9]" />
              <span className="ml-2 hidden sm:inline-block rounded-md border border-[#E4DAC9] bg-[#FFFFFF] px-3 py-0.5 text-xs font-mono text-[#7A6A5A]">
                app.tenderguard.ai/eligibility/demo
              </span>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7A6A5A]">
              Interactive Preview
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            {/* Sidebar Hint on the Left */}
            <div className="hidden md:flex md:col-span-3 flex-col justify-between border-r border-[#E4DAC9] bg-[#FAF7F2] p-4 text-xs">
              <div className="space-y-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7A6A5A]">
                  Navigation
                </div>
                <nav className="space-y-1">
                  <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#7A6A5A] hover:bg-[#F3EDE3]">
                    <Home size={15} />
                    <span>Home</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#7A6A5A] hover:bg-[#F3EDE3]">
                    <Bookmark size={15} />
                    <span>Watchlist</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg bg-[#E4DAC9]/40 px-2.5 py-2 font-semibold text-[#2E2118]">
                    <ShieldCheck size={15} className="text-[#6B4226]" />
                    <span>Eligibility</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[#7A6A5A] hover:bg-[#F3EDE3]">
                    <Bell size={15} />
                    <span>Alerts</span>
                  </div>
                </nav>
              </div>

              <div className="rounded-lg border border-[#E4DAC9] bg-[#FFFFFF] p-2.5 text-[11px]">
                <div className="font-semibold text-[#2E2118]">Active Profile</div>
                <div className="text-[#7A6A5A]">Turnover: ₹30L</div>
                <div className="text-[#7A6A5A]">Exp: 2 Years</div>
              </div>
            </div>

            {/* Main Demo Workspace on the Right */}
            <div className="md:col-span-9 p-5 sm:p-6 flex flex-col justify-between space-y-6">
              {/* Segmented Control Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DAC9] pb-4">
                <div className="inline-flex rounded-xl border border-[#E4DAC9] bg-[#FAF7F2] p-1">
                  {scenarios.map((sc) => {
                    const isSelected = activeScenario.id === sc.id;
                    const dotColor =
                      sc.verdict === 'BID'
                        ? 'bg-[#2E7D4F]'
                        : sc.verdict === 'RISKY'
                        ? 'bg-[#B7791F]'
                        : 'bg-[#B23A2E]';

                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          setActiveScenario(sc);
                          setSelectedRowIndex(0);
                        }}
                        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] ${
                          isSelected
                            ? 'bg-[#FFFFFF] text-[#2E2118] shadow-sm'
                            : 'text-[#7A6A5A] hover:text-[#2E2118]'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                        <span>{sc.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Score & Verdict Banner */}
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        className="stroke-[#E4DAC9]"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        className="transition-all duration-700 ease-out"
                        stroke={
                          activeScenario.verdict === 'BID'
                            ? '#2E7D4F'
                            : activeScenario.verdict === 'RISKY'
                            ? '#B7791F'
                            : '#B23A2E'
                        }
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="absolute text-xs font-bold text-[#2E2118]">
                      {activeScenario.score}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white ${
                      activeScenario.verdict === 'BID'
                        ? 'bg-[#2E7D4F]'
                        : activeScenario.verdict === 'RISKY'
                        ? 'bg-[#B7791F]'
                        : 'bg-[#B23A2E]'
                    }`}
                  >
                    {activeScenario.verdict === 'BID' ? (
                      <CheckCircle2 size={14} />
                    ) : activeScenario.verdict === 'RISKY' ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                    <span>{activeScenario.verdict}</span>
                  </span>
                </div>
              </div>

              {/* Scenario Title */}
              <div>
                <span className="text-[12px] font-mono uppercase tracking-[0.08em] text-[#7A6A5A]">
                  Tender Title
                </span>
                <h3 className="text-base sm:text-[18px] font-semibold text-[#2E2118]">
                  {activeScenario.title}
                </h3>
              </div>

              {/* Split View: Rows on left, Evidence Panel on right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 3 Requirement Rows */}
                <div className="lg:col-span-7 divide-y divide-[#E4DAC9] border border-[#E4DAC9] rounded-[14px] bg-[#FAF7F2] p-2">
                  {activeScenario.rows.map((row, idx) => {
                    const isSelected = selectedRowIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedRowIndex(idx)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-xs sm:text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] ${
                          isSelected
                            ? 'bg-[#FFFFFF] shadow-sm border border-[#E4DAC9]'
                            : 'hover:bg-[#FFFFFF]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {row.status === 'PASS' ? (
                            <Check size={16} className="text-[#2E7D4F] shrink-0" />
                          ) : row.status === 'RISK' ? (
                            <AlertTriangle size={16} className="text-[#B7791F] shrink-0" />
                          ) : (
                            <XCircle size={16} className="text-[#B23A2E] shrink-0" />
                          )}
                          <span className="font-semibold text-[#2E2118]">{row.name}</span>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[#7A6A5A] text-xs">Req: {row.needs}</span>
                          <span className="font-semibold text-[#2E2118] text-xs hidden sm:inline">
                            You: {row.youHave}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Evidence Panel */}
                <div className="lg:col-span-5 rounded-[14px] border border-[#E4DAC9] bg-[#FAF7F2] p-4 text-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7A6A5A]">
                        Evidence Panel
                      </span>
                      <span className="text-[11px] font-mono text-[#7A6A5A]">
                        {activeRow.sourceDoc}
                      </span>
                    </div>

                    <div className="rounded-lg border border-[#E4DAC9] bg-[#FFFFFF] p-3 text-xs leading-relaxed text-[#2E2118]">
                      <div className="font-semibold mb-1 text-[#7A6A5A]">Quoted Clause:</div>
                      &ldquo;{activeRow.clause}&rdquo;
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#E4DAC9] flex items-center justify-between">
                    <span className="text-[11px] text-[#2F6B4F] font-semibold flex items-center gap-1">
                      <Check size={13} />
                      <span>Verified source</span>
                    </span>
                    <a
                      href="#demo"
                      className="inline-flex items-center gap-1 font-semibold text-[#6B4226] hover:underline"
                    >
                      <span>Open source</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-[#E4DAC9] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[13px] text-[#7A6A5A]">
                  Click any requirement row to view exact quoted clauses.
                </span>
                <Link
                  href="/overview"
                  className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-[#6B4226] px-5 text-sm font-semibold text-[#FAF7F2] transition hover:bg-[#553320] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226]"
                >
                  Open full analysis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-[#E4DAC9] bg-[#FFFFFF] py-[72px] lg:py-[120px]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-[40px] sm:leading-[46px] font-semibold tracking-tight text-[#2E2118]">
              How it works
            </h2>
          </div>

          {/* Three Connected Columns with Illustrated UI Fragments */}
          <div className="relative mt-14 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Step 1: Profile Form Snippet */}
              <div className="flex flex-col space-y-4">
                <div className="h-44 rounded-[14px] border border-[#E4DAC9] bg-[#FAF7F2] p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E4DAC9] pb-2 text-[11px] font-semibold text-[#7A6A5A] uppercase tracking-[0.08em]">
                    <span>Business Profile</span>
                    <span className="font-mono text-[#6B4226]">Saved</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-[10px] text-[#7A6A5A] uppercase tracking-[0.08em]">Turnover</div>
                      <div className="rounded border border-[#E4DAC9] bg-[#FFFFFF] px-2.5 py-1 font-semibold text-[#2E2118]">
                        ₹30,00,000 / year
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7A6A5A] uppercase tracking-[0.08em]">Experience</div>
                      <div className="rounded border border-[#E4DAC9] bg-[#FFFFFF] px-2.5 py-1 font-semibold text-[#2E2118]">
                        2 Years &middot; IT &amp; Networking
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="rounded bg-[#E4DAC9] px-2 py-0.5 text-[10px] font-semibold text-[#2E2118]">
                      Udyam MSME
                    </span>
                    <span className="rounded bg-[#E4DAC9] px-2 py-0.5 text-[10px] font-semibold text-[#2E2118]">
                      Active GSTIN
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#2E2118]">
                    Save your profile
                  </h3>
                  <p className="mt-1 text-base text-[#7A6A5A]">
                    Set your turnover and past experience once.
                  </p>
                </div>
              </div>

              {/* Step 2: Mini Agent Log */}
              <div className="flex flex-col space-y-4 relative">
                {/* Arrow connector for desktop */}
                <div className="hidden md:flex absolute -left-5 top-20 -translate-y-1/2 text-[#E4DAC9]">
                  <ArrowRight size={18} />
                </div>

                <div className="h-44 rounded-[14px] border border-[#E4DAC9] bg-[#FAF7F2] p-4 flex flex-col justify-between shadow-sm font-mono text-[11px]">
                  <div className="flex items-center justify-between border-b border-[#E4DAC9] pb-2 text-[11px] font-sans font-semibold text-[#7A6A5A] uppercase tracking-[0.08em]">
                    <span>TinyFish Agent Log</span>
                    <Loader2 size={13} className="animate-spin text-[#6B4226]" />
                  </div>
                  <div className="space-y-1.5 text-[#2E2118]">
                    <div className="flex items-center gap-1.5 text-[#2F6B4F]">
                      <Check size={12} />
                      <span>Connected: eprocure.gov.in</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#2F6B4F]">
                      <Check size={12} />
                      <span>Indexed 48 tender notice pages</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B4226]">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Cross-checking clauses 3.1 &amp; 4.2...</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#7A6A5A] pt-1 border-t border-[#E4DAC9]">
                    Execution: 1.4s &middot; No login used
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#2E2118]">
                    Agent reads the tender
                  </h3>
                  <p className="mt-1 text-base text-[#7A6A5A]">
                    TinyFish reads public portal notices and PDFs.
                  </p>
                </div>
              </div>

              {/* Step 3: Mini Verdict Card */}
              <div className="flex flex-col space-y-4 relative">
                {/* Arrow connector for desktop */}
                <div className="hidden md:flex absolute -left-5 top-20 -translate-y-1/2 text-[#E4DAC9]">
                  <ArrowRight size={18} />
                </div>

                <div className="h-44 rounded-[14px] border border-[#E4DAC9] bg-[#FAF7F2] p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E4DAC9] pb-2 text-[11px] font-semibold text-[#7A6A5A] uppercase tracking-[0.08em]">
                    <span>Decision Proof</span>
                    <span className="font-mono text-[#2F6B4F]">Score: 95/100</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="inline-flex items-center gap-1.5 rounded bg-[#2E7D4F] px-2.5 py-1 text-xs font-bold text-white">
                      <CheckCircle2 size={13} />
                      <span>BID VERDICT CONFIRMED</span>
                    </div>
                    <div className="text-[12px] text-[#2E2118] font-medium pt-1">
                      Turnover passes: ₹30L &ge; ₹15L required
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#7A6A5A] pt-1 border-t border-[#E4DAC9]">
                    <span>0 Disqualification risks</span>
                    <span className="font-semibold text-[#6B4226]">Clause proof linked</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#2E2118]">
                    Get a verdict with proof
                  </h3>
                  <p className="mt-1 text-base text-[#7A6A5A]">
                    See exact clauses and disqualification risks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPARISON */}
      <section className="border-t border-[#E4DAC9] py-[72px] lg:py-[120px] bg-[#FAF7F2]">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-[40px] sm:leading-[46px] font-semibold tracking-tight text-[#2E2118]">
              Portal browsing vs TenderGuard
            </h2>
          </div>

          <div className="mt-12 overflow-hidden rounded-[14px] border border-[#E4DAC9] bg-[#FFFFFF] shadow-sm">
            <table className="w-full border-collapse text-left text-sm sm:text-base">
              <thead>
                <tr className="border-b border-[#E4DAC9] text-[13px] font-semibold text-[#7A6A5A]">
                  <th className="py-4 pl-6 pr-4 font-normal">Check</th>
                  <th className="py-4 px-4 font-normal">Portal browsing</th>
                  <th className="py-4 pr-6 pl-4 font-bold text-[#6B4226] bg-[#DDE9DF]/40 border-t-2 border-[#2F6B4F]">
                    TenderGuard
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DAC9]">
                <tr>
                  <td className="py-4 pl-6 pr-4 font-semibold text-[#2E2118]">
                    Eligibility
                  </td>
                  <td className="py-4 px-4 text-[#7A6A5A]">
                    <div className="flex items-center gap-2">
                      <X size={16} className="text-[#B23A2E] shrink-0" />
                      <span>Read 30 to 50 pages yourself</span>
                    </div>
                  </td>
                  <td className="py-4 pr-6 pl-4 font-semibold text-[#2F6B4F] bg-[#DDE9DF]/40">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#2F6B4F] shrink-0" />
                      <span>Checked against your profile</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 pl-6 pr-4 font-semibold text-[#2E2118]">
                    Risk
                  </td>
                  <td className="py-4 px-4 text-[#7A6A5A]">
                    <div className="flex items-center gap-2">
                      <X size={16} className="text-[#B23A2E] shrink-0" />
                      <span>Found after paying fees</span>
                    </div>
                  </td>
                  <td className="py-4 pr-6 pl-4 font-semibold text-[#2F6B4F] bg-[#DDE9DF]/40">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#2F6B4F] shrink-0" />
                      <span>Flagged before you bid</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 pl-6 pr-4 font-semibold text-[#2E2118]">
                    Proof
                  </td>
                  <td className="py-4 px-4 text-[#7A6A5A]">
                    <div className="flex items-center gap-2">
                      <X size={16} className="text-[#B23A2E] shrink-0" />
                      <span>Manual notes</span>
                    </div>
                  </td>
                  <td className="py-4 pr-6 pl-4 font-semibold text-[#2F6B4F] bg-[#DDE9DF]/40">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#2F6B4F] shrink-0" />
                      <span>Exact clause and link</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 pl-6 pr-4 font-semibold text-[#2E2118]">
                    Changes
                  </td>
                  <td className="py-4 px-4 text-[#7A6A5A]">
                    <div className="flex items-center gap-2">
                      <X size={16} className="text-[#B23A2E] shrink-0" />
                      <span>Re-check pages daily</span>
                    </div>
                  </td>
                  <td className="py-4 pr-6 pl-4 font-semibold text-[#2F6B4F] bg-[#DDE9DF]/40">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#2F6B4F] shrink-0" />
                      <span>Alert when a deadline moves</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="border-t border-[#E4DAC9] bg-[#FFFFFF] py-[72px] lg:py-[120px]">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl sm:text-[40px] sm:leading-[46px] font-semibold tracking-tight text-[#2E2118]">
              Common questions
            </h2>
          </div>

          <div className="mt-12 divide-y divide-[#E4DAC9] border-y border-[#E4DAC9]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left text-base font-semibold text-[#2E2118] hover:text-[#6B4226] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B4226] rounded transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-[#7A6A5A] ml-4">
                      {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-base leading-relaxed text-[#7A6A5A]">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="bg-[#2E2118] py-[72px] lg:py-[120px] text-center text-[#FAF7F2]">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 space-y-8">
          <h2 className="font-serif text-3xl sm:text-[48px] sm:leading-[54px] font-semibold tracking-tight text-[#FAF7F2]">
            Stop guessing. Start bidding smart.
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/overview"
              className="inline-flex min-h-[48px] items-center justify-center rounded-[14px] bg-[#FAF7F2] px-6 text-base font-semibold text-[#6B4226] transition hover:bg-[#FFFFFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2E2118]"
            >
              Try the live demo
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-[48px] items-center gap-1.5 text-base font-semibold text-[#FAF7F2]/90 hover:text-white transition px-2"
            >
              <span>See how it works</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-[#E4DAC9] bg-[#FAF7F2] py-8 text-[13px] text-[#7A6A5A]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center md:text-left">
            <span className="font-semibold text-[#2E2118]">TenderGuard AI</span>
            <span>&middot;</span>
            <span>Decision support, not legal advice. Verify against the official tender document.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#demo" className="hover:text-[#2E2118] transition">
              Demo
            </a>
            <a href="#how-it-works" className="hover:text-[#2E2118] transition">
              How it works
            </a>
            <a href="#faq" className="hover:text-[#2E2118] transition">
              FAQ
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Action Button */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#E4DAC9] bg-[#FAF7F2]/95 p-3 backdrop-blur-md">
        <Link
          href="/overview"
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[#6B4226] px-5 text-sm font-semibold text-[#FAF7F2] active:bg-[#553320]"
        >
          Try the live demo
        </Link>
      </div>
    </div>
  );
}
