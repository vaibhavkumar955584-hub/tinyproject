'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  BellRing,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Pause,
  Play,
  Radio,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { DEMO_ALERTS, DEMO_TENDERS, type CorrigendumAlert } from '../../../lib/data';
import { VerdictBadge } from '../../../components/verdict';

export default function MonitoringPage() {
  const [alerts, setAlerts] = useState<CorrigendumAlert[]>(DEMO_ALERTS);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [watchedTenders, setWatchedTenders] = useState([
    {
      id: 'demo-cppp-001',
      title: 'Managed IT Helpdesk and Endpoint Support Services for District Collectorate & Tehsils',
      source: 'CPPP',
      ref: 'CPPP/2026/PWD/IT-0941',
      active: true,
      intervalHours: 4,
      lastChecked: '10 mins ago',
      deadline: '20 Dec 2026',
    },
    {
      id: 'demo-cppp-002',
      title: 'Comprehensive Annual Maintenance Contract (AMC) for LAN, Optical Fiber & CCTV Surveillance',
      source: 'CPPP',
      ref: 'CPPP/2026/SIU/NET-8820',
      active: true,
      intervalHours: 2,
      lastChecked: '4 mins ago',
      deadline: '10 Nov 2026 (Extended)',
    },
  ]);

  const toggleWatch = (id: string) => {
    setWatchedTenders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  const simulateNewChange = () => {
    const newAlert: CorrigendumAlert = {
      id: `alert-${Date.now()}`,
      changeType: 'DEADLINE',
      beforeJson: { closingAt: '10 November 2026 15:30 IST', notice: 'Corrigendum #1' },
      afterJson: { closingAt: '17 November 2026 15:30 IST', notice: 'Corrigendum #2 (Further 7-day extension)' },
      verdictBefore: 'RISKY',
      verdictAfter: 'BID',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tender: {
        id: 'demo-cppp-002',
        title: 'Comprehensive Annual Maintenance Contract (AMC) for LAN, Optical Fiber & CCTV Surveillance',
        source: 'CPPP',
        url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
      },
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const connectTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramChatId.trim()) return;
    setTelegramStatus(`Telegram connected to Chat ID: ${telegramChatId}. Test alert dispatched.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <Radio size={12} />
              Corrigendum & Change Radar
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              15-Minute Autonomous Polling
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            Tender Monitoring & Subscriptions
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Track corrigenda, deadline postponements, EMD modifications, and clause addenda across government portals in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={simulateNewChange}
            className="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Wand2 size={15} />
            <span>Simulate Corrigendum Change</span>
          </button>
        </div>
      </div>

      {/* 2. Monitoring Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
            Active Subscriptions
          </span>
          <div className="mt-2 text-2xl font-bold text-[#2E2118] dark:text-[#F2EBE1]">
            {watchedTenders.filter((w) => w.active).length} Tenders
          </div>
          <span className="mt-1 block text-[11px] text-[#2F6B4F] dark:text-[#7BB896] font-semibold">
            Checking every 2 to 4 hours
          </span>
        </div>

        <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-4 shadow-sm dark:border-[#2D543D] dark:bg-[#202E26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6B4F] dark:text-[#7BB896] block">
            Corrigenda Detected
          </span>
          <div className="mt-2 text-2xl font-bold text-[#2F6B4F] dark:text-[#7BB896]">
            {alerts.length} Changes
          </div>
          <span className="mt-1 block text-[11px] text-[#3E5C4A] dark:text-[#8CB89C]">
            1 deadline extension · 1 clause relax
          </span>
        </div>

        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
            Alert Channels
          </span>
          <div className="mt-2 text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
            In-App & Email
          </div>
          <span className="mt-1 block text-[11px] text-[#6B6259] dark:text-[#9E958A]">
            Telegram integration available below
          </span>
        </div>

        <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8276] block">
            Radar Health
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-base font-bold text-[#2F6B4F] dark:text-[#7BB896]">
            <CheckCircle2 size={18} />
            <span>100% Operational</span>
          </div>
          <span className="mt-1 block text-[11px] text-[#6B6259] dark:text-[#9E958A]">
            Zero missed portal gazettes
          </span>
        </div>
      </div>

      {/* 3. Corrigendum Timeline with Before / After Diff Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E]">
            Corrigendum Change Feed & Before/After Diff
          </h3>
          <span className="text-xs text-[#8C8276]">{alerts.length} notifications recorded</span>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] shadow-sm overflow-hidden dark:border-[#38312A] dark:bg-[#221D19]"
            >
              {/* Alert Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DED2] bg-[#FAF7F2] p-4 text-xs dark:border-[#38312A] dark:bg-[#1E1915]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FAF2E2] text-[#94631A] dark:bg-[#332817] dark:text-[#DEBA70]">
                    <BellRing size={16} />
                  </span>
                  <div>
                    <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] block">
                      {alert.changeType === 'DEADLINE'
                        ? 'Submission Deadline Extension Detected'
                        : 'Eligibility Condition Relaxed via Corrigendum'}
                    </span>
                    <span className="text-[10px] text-[#8C8276]">
                      {new Date(alert.sentAt).toLocaleString('en-IN')} · {alert.tender.source} Portal
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={alert.tender.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-[#E8DED2] bg-white px-2.5 py-1 text-xs font-bold text-[#6B4226] hover:bg-[#F6F1E9] dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#B8977E]"
                  >
                    <span>View Gazette</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* Alert Content & Diff Comparison */}
              <div className="p-5">
                <Link
                  href={`/tenders/${alert.tender.id}`}
                  className="text-sm font-bold text-[#2E2118] hover:text-[#6B4226] transition dark:text-[#F2EBE1] dark:hover:text-[#CCAFA0]"
                >
                  {alert.tender.title}
                </Link>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center text-xs">
                  {/* Before */}
                  <div className="rounded-xl border border-[#ECC2BD] bg-[#FAEDE9] p-3.5 dark:border-[#5C322D] dark:bg-[#382421]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A83832] dark:text-[#DE8F87] block mb-1">
                      Before Corrigendum (Original)
                    </span>
                    <p className="font-semibold text-[#A83832] dark:text-[#DE8F87] line-through">
                      {alert.changeType === 'DEADLINE'
                        ? String(alert.beforeJson.closingAt || '03 November 2026 15:30 IST')
                        : String(alert.beforeJson.turnoverRequirement || alert.beforeJson.clause)}
                    </p>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex justify-center text-[#8C8276]">
                    <ArrowRightLeft size={18} />
                  </div>

                  {/* Now */}
                  <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-3.5 dark:border-[#2D543D] dark:bg-[#202E26]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:text-[#7BB896] block mb-1">
                      Now (Corrigendum In Effect)
                    </span>
                    <p className="font-bold text-[#2F6B4F] dark:text-[#7BB896]">
                      {alert.changeType === 'DEADLINE'
                        ? String(alert.afterJson.closingAt || alert.afterJson.note)
                        : String(alert.afterJson.turnoverRequirement || alert.afterJson.clause)}
                    </p>
                  </div>
                </div>

                {alert.verdictBefore && alert.verdictAfter && (
                  <div className="mt-4 flex items-center gap-2 text-xs border-t border-[#E8DED2] pt-3 dark:border-[#38312A]">
                    <span className="text-[#6B6259] dark:text-[#9E958A]">Eligibility Impact:</span>
                    <VerdictBadge verdict={alert.verdictBefore} />
                    <ArrowRight size={13} className="text-[#8C8276]" />
                    <VerdictBadge verdict={alert.verdictAfter} />
                    <span className="text-[11px] font-semibold text-[#2F6B4F] ml-2">
                      Suitability upgraded
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active Monitored Tenders Table */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 mb-4 dark:border-[#38312A]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E]">
              Active Radar Subscriptions
            </h3>
            <p className="text-[11px] text-[#6B6259] dark:text-[#9E958A]">
              Tenders automatically polled for portal updates every 2 to 4 hours.
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
          >
            + Add Tender to Watchlist
          </Link>
        </div>

        <div className="space-y-3">
          {watchedTenders.map((watch) => (
            <div
              key={watch.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#E8DED2] bg-[#FAF7F2] p-4 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    watch.active
                      ? 'bg-[#EBF4EF] text-[#2F6B4F] dark:bg-[#202E26] dark:text-[#7BB896]'
                      : 'bg-[#F3EEE6] text-[#8C8276] dark:bg-[#28231E]'
                  }`}
                >
                  <Radio size={16} />
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-[#6B4226] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                      {watch.source}
                    </span>
                    <span className="font-mono text-[10px] text-[#8C8276]">{watch.ref}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        watch.active
                          ? 'bg-[#EBF4EF] text-[#2F6B4F] dark:bg-[#202E26] dark:text-[#7BB896]'
                          : 'bg-[#FAF2E2] text-[#94631A]'
                      }`}
                    >
                      {watch.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <Link
                    href={`/tenders/${watch.id}`}
                    className="font-bold text-[#2E2118] hover:underline dark:text-[#F2EBE1] line-clamp-1"
                  >
                    {watch.title}
                  </Link>
                  <p className="mt-1 text-[11px] text-[#6B6259] dark:text-[#9E958A]">
                    Last checked: {watch.lastChecked} · Deadline: {watch.deadline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleWatch(watch.id)}
                  className="rounded-lg border border-[#E8DED2] bg-white px-3 py-1.5 text-xs font-bold text-[#2E2118] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1]"
                >
                  {watch.active ? (
                    <span className="inline-flex items-center gap-1">
                      <Pause size={12} /> Pause
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Play size={12} /> Resume
                    </span>
                  )}
                </button>
                <Link
                  href={`/tenders/${watch.id}`}
                  className="rounded-lg bg-[#6B4226] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#52311A] transition"
                >
                  Inspect
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Telegram & Notification Integration Card */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex items-center gap-2 border-b border-[#E8DED2] pb-3 mb-3 dark:border-[#38312A]">
          <Send size={16} className="text-[#2B4E6B] dark:text-[#8AB4CF]" />
          <h3 className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
            Instant Telegram Corrigendum Alerts
          </h3>
        </div>
        <p className="text-xs text-[#6B6259] dark:text-[#9E958A] mb-3">
          Receive push notifications directly on your phone as soon as TinyFish detects a corrigendum, deadline modification, or relaxed eligibility clause.
        </p>
        <form onSubmit={connectTelegram} className="flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            type="text"
            placeholder="Enter Telegram Chat ID (e.g. 582194012)"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            className="flex-1 rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
          />
          <button type="submit" className="btn-secondary py-2 px-4 text-xs font-bold">
            Connect Bot
          </button>
        </form>
        {telegramStatus && (
          <p className="mt-2 text-xs font-semibold text-[#2F6B4F] dark:text-[#7BB896]">
            {telegramStatus}
          </p>
        )}
      </div>
    </div>
  );
}

