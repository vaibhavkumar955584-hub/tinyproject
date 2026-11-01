'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  FileCheck2,
  FileQuestion,
  FileText,
  FileWarning,
  IndianRupee,
  Layers,
  MapPin,
  Quote,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { DEMO_TENDERS, DEMO_PROFILE, type TenderOpportunity } from '../../../lib/data';
import { formatInr } from '../../../components/tender-table';

type StatusType = 'ELIGIBLE' | 'NEEDS_REVIEW' | 'NOT_ELIGIBLE';

function getStatusBadge(status: StatusType) {
  if (status === 'ELIGIBLE') {
    return {
      label: 'Eligible',
      className:
        'border-[#BCD8C7] bg-[#EBF4EF] text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]',
      icon: CheckCircle2,
    };
  }
  if (status === 'NEEDS_REVIEW') {
    return {
      label: 'Needs Review',
      className:
        'border-[#E8D5B5] bg-[#FAF2E2] text-[#94631A] dark:border-[#524024] dark:bg-[#332817] dark:text-[#DEBA70]',
      icon: AlertTriangle,
    };
  }
  return {
    label: 'Not Eligible',
    className:
      'border-[#ECC2BD] bg-[#FAEDE9] text-[#A83832] dark:border-[#5C322D] dark:bg-[#382421] dark:text-[#DE8F87]',
    icon: XCircle,
  };
}

export default function EligibilityPage() {
  const [selectedTenderId, setSelectedTenderId] = useState(DEMO_TENDERS[0]!.id);
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);

  const tender = (DEMO_TENDERS.find((t) => t.id === selectedTenderId) ?? DEMO_TENDERS[0])!;

  // Derive eligibility attributes for the selected tender
  const turnoverReq = tender.requirements.find((r) => r.type === 'TURNOVER');
  const minTurnover = Number(turnoverReq?.valueJson?.minimumInr || 0);
  const turnoverStatus: StatusType =
    minTurnover === 0
      ? 'ELIGIBLE'
      : DEMO_PROFILE.annualTurnoverInr >= minTurnover * 1.2
      ? 'ELIGIBLE'
      : DEMO_PROFILE.annualTurnoverInr >= minTurnover
      ? 'NEEDS_REVIEW'
      : 'NOT_ELIGIBLE';

  const expReq = tender.requirements.find((r) => r.type === 'EXPERIENCE');
  const minExp = Number(expReq?.valueJson?.minimumYears || 0);
  const expStatus: StatusType =
    minExp === 0
      ? 'ELIGIBLE'
      : DEMO_PROFILE.experienceYears >= minExp
      ? 'ELIGIBLE'
      : 'NOT_ELIGIBLE';

  const emdReq = tender.requirements.find((r) => r.type === 'EMD');
  const emdStatus: StatusType =
    tender.emdInr === 0 || emdReq?.valueJson?.msmeExemption
      ? 'ELIGIBLE'
      : tender.emdInr > DEMO_PROFILE.annualTurnoverInr * 0.05
      ? 'NEEDS_REVIEW'
      : 'ELIGIBLE';

  const certReq = tender.requirements.find((r) => r.type === 'CERTIFICATION');
  const reqCertName = String(certReq?.valueJson?.name || '');
  const certStatus: StatusType = !certReq
    ? 'ELIGIBLE'
    : DEMO_PROFILE.certifications.some((c) => c.toLowerCase().includes(reqCertName.toLowerCase()))
    ? 'ELIGIBLE'
    : 'NOT_ELIGIBLE';

  const locationReq = tender.requirements.find((r) => r.type === 'LOCATION');
  const locStatus: StatusType = !locationReq
    ? 'ELIGIBLE'
    : tender.location.toLowerCase().includes(DEMO_PROFILE.state.toLowerCase())
    ? 'ELIGIBLE'
    : 'NOT_ELIGIBLE';

  const overallStatus: StatusType =
    tender.verdict === 'BID'
      ? 'ELIGIBLE'
      : tender.verdict === 'RISKY'
      ? 'NEEDS_REVIEW'
      : 'NOT_ELIGIBLE';

  const overallBadge = getStatusBadge(overallStatus);
  const OverallIcon = overallBadge.icon;

  return (
    <div className="space-y-6">
      {/* Header and Tender Selector */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
            <Sparkles size={12} />
            Deterministic Eligibility Engine
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            AI Eligibility Intelligence
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Zero guessing. Every qualification rule is matched against your recorded business credentials with verbatim portal citations.
          </p>
        </div>

        {/* Tender switcher */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <label className="text-[11px] font-bold text-[#6B6259] dark:text-[#9E958A]">
            Select tender to analyze:
          </label>
          <select
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs font-bold text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1] max-w-xs"
          >
            {DEMO_TENDERS.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.source}] {t.sourceTenderId} ({t.verdict})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tender Header Summary Card */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FAF7F2] p-4 text-xs dark:border-[#38312A] dark:bg-[#1E1915]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#6B4226] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              {tender.source}
            </span>
            <span className="font-mono text-[11px] font-bold text-[#6B4226] dark:text-[#CCAFA0]">
              {tender.sourceTenderId}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#6B6259] dark:text-[#9E958A]">
            <span>Estimated: <b>{formatInr(tender.estimatedValueInr)}</b></span>
            <span>·</span>
            <span>Closes: <b>{new Date(tender.closingAt).toLocaleDateString('en-IN')}</b></span>
            <a
              href={tender.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
            >
              <span>Portal Link</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <h2 className="mt-3 text-sm font-bold text-[#2E2118] dark:text-[#F2EBE1]">
          {tender.title}
        </h2>
        <p className="mt-1 text-[#6B6259] dark:text-[#9E958A]">{tender.department}</p>
      </div>

      {/* Overall Score & Verdict Banner */}
      <div className="rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Visual Score Ring */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#E8DED2] bg-[#FAF7F2] dark:border-[#38312A] dark:bg-[#1A1613]">
              <div className="text-center">
                <span className="block text-2xl font-black text-[#2E2118] dark:text-[#F2EBE1]">
                  {tender.matchScore}
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-[#8C8276]">
                  SCORE
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${overallBadge.className}`}
                >
                  <OverallIcon size={14} />
                  <span>{overallBadge.label}</span>
                </span>
                <span className="text-xs text-[#8C8276]">
                  {tender.requirements.length} conditions evaluated
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                {overallStatus === 'ELIGIBLE'
                  ? 'Your profile meets all stated tender criteria.'
                  : overallStatus === 'NEEDS_REVIEW'
                  ? 'Review required on specific thresholds or certifications before bidding.'
                  : 'Critical disqualification risk identified; bidding not recommended.'}
              </h3>
              <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A] max-w-2xl leading-relaxed">
                {tender.summary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <Link
              href="/bid-readiness"
              className="btn-primary py-2 px-3 text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <ClipboardList size={14} />
              <span>Prepare Bid Checklist</span>
            </Link>
            <Link
              href="/reports"
              className="btn-secondary py-2 px-3 text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <Download size={14} />
              <span>Export Dossier (PDF)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Requirements Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E]">
          Clause-by-Clause Evaluation
        </h3>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. Turnover Requirement */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
            <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
              <span className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                1. Annual Turnover Requirement
              </span>
              {(() => {
                const b = getStatusBadge(turnoverStatus);
                const I = b.icon;
                return (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${b.className}`}>
                    <I size={11} /> {b.label}
                  </span>
                );
              })()}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">Tender Asks:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {minTurnover > 0 ? formatInr(minTurnover) : 'Not Specified'}
                </span>
              </div>
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">Your Profile:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {formatInr(DEMO_PROFILE.annualTurnoverInr)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B6259] dark:text-[#9E958A]">
              {turnoverStatus === 'ELIGIBLE'
                ? `Your annual turnover of ${formatInr(DEMO_PROFILE.annualTurnoverInr)} exceeds the tender minimum of ${formatInr(minTurnover)}.`
                : turnoverStatus === 'NEEDS_REVIEW'
                ? `Your turnover of ${formatInr(DEMO_PROFILE.annualTurnoverInr)} is within 10% of the threshold (${formatInr(minTurnover)}). Ensure strict average accounting method.`
                : `Your turnover of ${formatInr(DEMO_PROFILE.annualTurnoverInr)} does not satisfy the mandatory ₹1.00 Cr requirement.`}
            </p>
            {turnoverReq && (
              <div className="mt-3 rounded-lg border border-[#E8DED2] bg-[#F6F1E9] p-2.5 text-[11px] text-[#2E2118] dark:border-[#38312A] dark:bg-[#28231E] dark:text-[#F2EBE1]">
                <span className="font-bold block text-[10px] uppercase text-[#6B4226] dark:text-[#CCAFA0] mb-0.5">
                  Verbatim Tender Clause:
                </span>
                “{turnoverReq.sourceQuote}”
              </div>
            )}
          </div>

          {/* 2. Previous Experience Requirement */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
            <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
              <span className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                2. Previous Operating Experience
              </span>
              {(() => {
                const b = getStatusBadge(expStatus);
                const I = b.icon;
                return (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${b.className}`}>
                    <I size={11} /> {b.label}
                  </span>
                );
              })()}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">Tender Asks:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {minExp > 0 ? `${minExp} Year(s)` : 'Not Specified'}
                </span>
              </div>
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">Your Profile:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {DEMO_PROFILE.experienceYears} Years
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B6259] dark:text-[#9E958A]">
              {expStatus === 'ELIGIBLE'
                ? `Your operating record of ${DEMO_PROFILE.experienceYears} years satisfies the stated experience criteria.`
                : `Your recorded experience of ${DEMO_PROFILE.experienceYears} years is below the required ${minExp} years.`}
            </p>
            {expReq && (
              <div className="mt-3 rounded-lg border border-[#E8DED2] bg-[#F6F1E9] p-2.5 text-[11px] text-[#2E2118] dark:border-[#38312A] dark:bg-[#28231E] dark:text-[#F2EBE1]">
                <span className="font-bold block text-[10px] uppercase text-[#6B4226] dark:text-[#CCAFA0] mb-0.5">
                  Verbatim Tender Clause:
                </span>
                “{expReq.sourceQuote}”
              </div>
            )}
          </div>

          {/* 3. EMD Requirement & MSME Exemption */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
            <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
              <span className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                3. Earnest Money Deposit (EMD)
              </span>
              {(() => {
                const b = getStatusBadge(emdStatus);
                const I = b.icon;
                return (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${b.className}`}>
                    <I size={11} /> {b.label}
                  </span>
                );
              })()}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">EMD Amount:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {formatInr(tender.emdInr)}
                </span>
              </div>
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">MSME Relaxation:</span>
                <span className="font-bold text-[#2F6B4F] dark:text-[#7BB896]">
                  {emdReq?.valueJson?.msmeExemption ? 'Exemption Applicable' : 'Confirm in pre-bid'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B6259] dark:text-[#9E958A]">
              {emdReq?.valueJson?.msmeExemption
                ? 'The tender explicitly grants 100% EMD fee waiver to registered Udyam Micro & Small Enterprises.'
                : tender.emdInr > DEMO_PROFILE.annualTurnoverInr * 0.05
                ? 'EMD amount represents over 5% of your annual turnover. Submit pre-bid query to clarify MSME exemption.'
                : 'Standard EMD amount is within normal operating cash flow.'}
            </p>
            {emdReq && (
              <div className="mt-3 rounded-lg border border-[#E8DED2] bg-[#F6F1E9] p-2.5 text-[11px] text-[#2E2118] dark:border-[#38312A] dark:bg-[#28231E] dark:text-[#F2EBE1]">
                <span className="font-bold block text-[10px] uppercase text-[#6B4226] dark:text-[#CCAFA0] mb-0.5">
                  Verbatim Tender Clause:
                </span>
                “{emdReq.sourceQuote}”
              </div>
            )}
          </div>

          {/* 4. Required Certifications */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
            <div className="flex items-center justify-between border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
              <span className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                4. Required Certifications
              </span>
              {(() => {
                const b = getStatusBadge(certStatus);
                const I = b.icon;
                return (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${b.className}`}>
                    <I size={11} /> {b.label}
                  </span>
                );
              })()}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">Mandatory Cert:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {reqCertName || 'Standard Statutory Only'}
                </span>
              </div>
              <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <span className="text-[10px] text-[#8C8276] block">Your Certificates:</span>
                <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1] line-clamp-1">
                  {DEMO_PROFILE.certifications.join(', ')}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#6B6259] dark:text-[#9E958A]">
              {certStatus === 'ELIGIBLE'
                ? `Your profile holds the required credentials (${DEMO_PROFILE.certifications.join(', ')}).`
                : `Your profile lacks ${reqCertName}. This is a mandatory pre-qualification criteria.`}
            </p>
            {certReq && (
              <div className="mt-3 rounded-lg border border-[#E8DED2] bg-[#F6F1E9] p-2.5 text-[11px] text-[#2E2118] dark:border-[#38312A] dark:bg-[#28231E] dark:text-[#F2EBE1]">
                <span className="font-bold block text-[10px] uppercase text-[#6B4226] dark:text-[#CCAFA0] mb-0.5">
                  Verbatim Tender Clause:
                </span>
                “{certReq.sourceQuote}”
              </div>
            )}
          </div>
        </div>

        {/* Missing Documents & Disqualification Risks Section */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-2">
          {/* Missing Documents Card */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
            <div className="flex items-center gap-2 border-b border-[#E8DED2] pb-3 dark:border-[#38312A]">
              <FileWarning size={16} className="text-[#94631A] dark:text-[#DEBA70]" />
              <h4 className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                Missing or Pending Documents
              </h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-start gap-2 rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <AlertCircle size={14} className="text-[#94631A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    Non-Blacklisting & Non-Debarment Affidavit
                  </span>
                  <p className="text-[11px] text-[#6B6259] dark:text-[#9E958A]">
                    Required on ₹100 non-judicial stamp paper notarized within 30 days of submission.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                <AlertCircle size={14} className="text-[#94631A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    Power of Attorney for Digital Signature
                  </span>
                  <p className="text-[11px] text-[#6B6259] dark:text-[#9E958A]">
                    Board resolution or registered POA delegating signing authority for online bid portal.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Disqualification Risks Card */}
          <div className="rounded-xl border border-[#ECC2BD] bg-[#FAEDE9] p-5 shadow-sm dark:border-[#5C322D] dark:bg-[#382421]">
            <div className="flex items-center gap-2 border-b border-[#ECC2BD] pb-3 dark:border-[#5C322D]">
              <ShieldAlert size={16} className="text-[#A83832] dark:text-[#DE8F87]" />
              <h4 className="text-xs font-bold text-[#A83832] dark:text-[#DE8F87]">
                Potential Disqualification Risks
              </h4>
            </div>
            <ul className="mt-3 space-y-2 text-xs">
              {tender.disqualificationRisks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 rounded-lg bg-white/70 p-2.5 dark:bg-black/30">
                  <span className="text-[#A83832] font-bold text-xs shrink-0">•</span>
                  <p className="text-[11px] text-[#2E2118] dark:text-[#F2EBE1] leading-relaxed">
                    {risk}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

