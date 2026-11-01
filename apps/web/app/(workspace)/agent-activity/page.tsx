'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileSearch,
  FileText,
  Filter,
  Globe,
  LoaderCircle,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { DEMO_AGENT_LOGS, type AgentLogEntry } from '../../../lib/data';

const sampleExtractions = {
  portal: 'CPPP (eprocure.gov.in)',
  tenderId: 'CPPP/2026/PWD/IT-0941',
  timestamp: new Date().toISOString(),
  extractedRequirements: [
    {
      type: 'TURNOVER',
      minimumInr: 1500000,
      confidence: 0.994,
      sourceQuote: 'The bidder shall have average annual turnover of at least Rs. 15 lakh during the last three financial years.',
    },
    {
      type: 'EXPERIENCE',
      minimumYears: 1,
      confidence: 0.982,
      sourceQuote: 'The bidder shall have at least 1 year of relevant IT services experience.',
    },
    {
      type: 'EMD',
      amountInr: 50000,
      msmeExemption: true,
      confidence: 0.991,
      sourceQuote: 'EMD is Rs. 50,000. Micro and Small Enterprises registered under Udyam are exempted from EMD deposit.',
    },
  ],
  verdict: 'BID',
  score: 95,
};

export default function AgentActivityPage() {
  const [logs, setLogs] = useState<AgentLogEntry[]>(DEMO_AGENT_LOGS);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DISCOVER' | 'EXTRACT' | 'EVALUATE' | 'MONITOR'>('ALL');
  const [showRawJson, setShowRawJson] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(6);

  // Simulation runner for live TinyFish agent
  const triggerSimulation = () => {
    setIsRunning(true);
    const newLogId = `log-${Date.now()}`;
    const newSteps: AgentLogEntry[] = [
      {
        id: `${newLogId}-1`,
        step: 'DISCOVER',
        detail: 'Connecting to GeM (gem.gov.in) API gateway. Initializing headless session for IT Infrastructure category.',
        ts: new Date().toISOString(),
        portal: 'GEM',
      },
      {
        id: `${newLogId}-2`,
        step: 'FETCH',
        detail: 'Streaming bid document GEM/2026/B/814421 from AIIMS New Delhi. Extracting PDF metadata (28 pages).',
        ts: new Date().toISOString(),
        portal: 'GEM',
        url: 'https://gem.gov.in/show_bid_details/814421',
      },
      {
        id: `${newLogId}-3`,
        step: 'EXTRACT',
        detail: 'Parsing Section 5 (Eligibility Criteria). Clause 5.1: ₹20L turnover minimum. Clause 5.2: 2 years experience.',
        ts: new Date().toISOString(),
        portal: 'GEM',
        confidence: 0.985,
      },
      {
        id: `${newLogId}-4`,
        step: 'EVALUATE',
        detail: 'Applying deterministic rule engine: ₹30L profile turnover satisfies ₹20L requirement. MSME EMD waiver detected.',
        ts: new Date().toISOString(),
        confidence: 0.99,
      },
      {
        id: `${newLogId}-5`,
        step: 'MONITOR',
        detail: 'Completed scan. 1 new high-probability opportunity indexed. Corrigendum watch established.',
        ts: new Date().toISOString(),
        portal: 'GEM',
      },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < newSteps.length) {
        const nextStep = newSteps[i];
        if (nextStep) {
          setLogs((prev) => [nextStep, ...prev]);
        }
        i++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 1200);
  };

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    return log.step === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <Cpu size={12} />
              TinyFish Agent Subsystem
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              Autonomous Web Procurement Agent
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            AI Agent Activity & Telemetry
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Watch TinyFish agents crawl public portals, parse complex tender PDFs, extract legal clauses, and evaluate MSME eligibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerSimulation}
            disabled={isRunning}
            className="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2 shadow-sm disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                <span>Agent Crawling Portals…</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run Agent Discovery Scan</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="btn-secondary py-2.5 px-3.5 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Code2 size={15} />
            <span>{showRawJson ? 'Hide JSON' : 'Inspect Extracted JSON'}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Agent Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Agent Execution State */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
            Agent Status
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-[#2F6B4F]' : 'bg-[#2B4E6B]'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning ? 'bg-[#2F6B4F]' : 'bg-[#2B4E6B]'}`}></span>
            </span>
            <span className="text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              {isRunning ? 'Crawling Active' : 'Radar Standby'}
            </span>
          </div>
          <span className="mt-1 block text-[11px] text-[#6B6259] dark:text-[#9E958A]">
            Corrigendum radar active every 15m
          </span>
        </div>

        {/* Card 2: Connected Portals */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
            Target Portals
          </span>
          <div className="mt-2 text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
            CPPP & GeM
          </div>
          <span className="mt-1 block text-[11px] text-[#2F6B4F] dark:text-[#7BB896] font-semibold">
            Public gazette nodes online
          </span>
        </div>

        {/* Card 3: Clauses Verified */}
        <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-4 shadow-sm dark:border-[#2D543D] dark:bg-[#202E26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6B4F] dark:text-[#7BB896] block">
            Extracted Clauses
          </span>
          <div className="mt-2 text-base font-bold text-[#2F6B4F] dark:text-[#7BB896]">
            100% Verbatim Quoted
          </div>
          <span className="mt-1 block text-[11px] text-[#3E5C4A] dark:text-[#8CB89C]">
            Zero AI hallucination tolerated
          </span>
        </div>

        {/* Card 4: Security & Compliance */}
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
            Portal Compliance
          </span>
          <div className="mt-2 text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
            Public Data Only
          </div>
          <span className="mt-1 block text-[11px] text-[#6B6259] dark:text-[#9E958A]">
            No CAPTCHA bypass or bidder login
          </span>
        </div>
      </div>

      {/* Raw Extracted JSON Drawer */}
      {showRawJson && (
        <div className="rounded-xl border border-[#E8DED2] bg-[#1E1915] p-5 text-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#38312A] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-[#CCAFA0]" />
              <span className="font-mono text-xs font-bold text-[#CCAFA0]">
                Raw TinyFish Extraction Telemetry Payload
              </span>
            </div>
            <button
              onClick={() => setShowRawJson(false)}
              className="text-xs text-[#9E958A] hover:text-white"
            >
              Close
            </button>
          </div>
          <pre className="font-mono text-[11px] text-[#A3D9B1] overflow-x-auto p-2 bg-black/40 rounded-lg max-h-72">
            {JSON.stringify(sampleExtractions, null, 2)}
          </pre>
        </div>
      )}

      {/* 3. Visual 6-Stage Autonomous Pipeline */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-4">
          Autonomous Procurement Agent Lifecycle
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          {[
            { step: '1. Discover', title: 'Portal Crawl', desc: 'Scan CPPP & GeM search indexes' },
            { step: '2. Filter', title: 'Keyword Match', desc: 'Match IT services & AMC scopes' },
            { step: '3. Fetch', title: 'Notice Download', desc: 'Read official tender PDF documents' },
            { step: '4. Extract', title: 'Clause Parsing', desc: 'Turnover, EMD, and experience rules' },
            { step: '5. Evaluate', title: 'Eligibility Rule', desc: 'Deterministic score vs MSME profile' },
            { step: '6. Monitor', title: 'Corrigendum Watch', desc: 'Alert on deadline or clause shifts' },
          ].map((stage, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 transition ${
                isRunning && i === 2
                  ? 'border-[#2F6B4F] bg-[#EBF4EF] animate-pulse dark:border-[#2D543D] dark:bg-[#202E26]'
                  : 'border-[#E8DED2] bg-[#FAF7F2] dark:border-[#38312A] dark:bg-[#1A1613]'
              }`}
            >
              <span className="text-[10px] font-bold text-[#6B4226] dark:text-[#CCAFA0] block">
                {stage.step}
              </span>
              <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] block mt-0.5">
                {stage.title}
              </span>
              <span className="text-[10px] text-[#8C8276] block mt-1 leading-snug">
                {stage.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Real-Time Activity Log Feed */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] shadow-sm overflow-hidden dark:border-[#38312A] dark:bg-[#221D19]">
        {/* Log Controls Header */}
        <div className="flex flex-col gap-3 border-b border-[#E8DED2] bg-[#FAF7F2] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#1E1915]">
          <div>
            <h3 className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
              Live Activity Timeline & Audit Log
            </h3>
            <p className="text-[11px] text-[#6B6259] dark:text-[#9E958A]">
              Showing all autonomous agent events with verifiable timestamps.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {(['ALL', 'DISCOVER', 'EXTRACT', 'EVALUATE', 'MONITOR'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? 'bg-[#6B4226] text-white shadow-sm'
                    : 'bg-white text-[#6B6259] hover:bg-[#F3EEE6] dark:bg-[#221D19] dark:text-[#9E958A]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="divide-y divide-[#E8DED2] dark:divide-[#38312A]">
          {filteredLogs.map((log, index) => {
            const isLatest = index === 0 && isRunning;
            const badgeBg =
              log.step === 'DISCOVER'
                ? 'bg-[#2B4E6B] text-white'
                : log.step === 'EXTRACT'
                ? 'bg-[#6B4226] text-white'
                : log.step === 'EVALUATE'
                ? 'bg-[#2F6B4F] text-white'
                : log.step === 'MONITOR'
                ? 'bg-[#94631A] text-white'
                : 'bg-[#6B6259] text-white';

            return (
              <div
                key={log.id}
                className={`p-4 transition ${
                  isLatest
                    ? 'bg-[#EBF4EF] border-l-4 border-l-[#2F6B4F] dark:bg-[#202E26]'
                    : 'hover:bg-[#FAF7F2] dark:hover:bg-[#28231E]/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${badgeBg}`}
                    >
                      {log.step}
                    </span>
                    {log.portal && (
                      <span className="font-mono text-[10px] text-[#8C8276]">
                        [{log.portal}]
                      </span>
                    )}
                    {log.confidence && (
                      <span className="text-[10px] font-bold text-[#2F6B4F] dark:text-[#7BB896]">
                        {Math.round(log.confidence * 100)}% Confidence
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] text-[#8C8276]">
                    {new Date(log.ts).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-[#2E2118] dark:text-[#F2EBE1] leading-relaxed">
                  {log.detail}
                </p>

                {log.url && (
                  <div className="mt-2">
                    <a
                      href={log.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
                    >
                      <Globe size={12} />
                      <span>{log.url}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

