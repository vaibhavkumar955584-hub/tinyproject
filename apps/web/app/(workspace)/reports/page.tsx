'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DEMO_TENDERS, DEMO_PROFILE } from '../../../lib/data';

interface ReportItem {
  id: string;
  title: string;
  type: string;
  tenderRef: string;
  generatedDate: string;
  size: string;
  status: 'READY' | 'PROCESSING';
  description: string;
}

const reportsList: ReportItem[] = [
  {
    id: 'rep-01',
    title: 'Pre-Qualification & Feasibility Dossier',
    type: 'PDF Dossier',
    tenderRef: 'CPPP/2026/PWD/IT-0941',
    generatedDate: '01 Nov 2026',
    size: '2.4 MB',
    status: 'READY',
    description: 'Complete clause-by-clause feasibility assessment matching ₹30L turnover against tender criteria with verbatim quotes.',
  },
  {
    id: 'rep-02',
    title: 'MSME PPP 2012 Exemption & Relaxation Pack',
    type: 'Statutory Pack',
    tenderRef: 'All Watched Tenders',
    generatedDate: '28 Oct 2026',
    size: '1.8 MB',
    status: 'READY',
    description: 'Compilation of Udyam registration certificates, Gazette notifications, and EMD waiver declarations under GFR Rule 173(i).',
  },
  {
    id: 'rep-03',
    title: 'Corrigendum Audit & Change History Log',
    type: 'Audit Trail',
    tenderRef: 'CPPP/2026/SIU/NET-8820',
    generatedDate: '01 Nov 2026',
    size: '890 KB',
    status: 'READY',
    description: 'Cryptographically verified timeline of Corrigendum #1 deadline extension and addenda published on CPPP.',
  },
  {
    id: 'rep-04',
    title: 'Technical Bid Compliance Matrix (Clause 4.1 - 4.8)',
    type: 'Excel / CSV',
    tenderRef: 'GEM/2026/B/814421',
    generatedDate: '29 Oct 2026',
    size: '420 KB',
    status: 'READY',
    description: 'Form-ready compliance checklist formatted for direct submission on Government e-Marketplace (GeM).',
  },
];

export default function ReportsPage() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = (id: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      window.print();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <FileText size={12} />
              Dossier & Audit Records
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              Export-Ready Bid Documents
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            Reports & Generated Documents
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Download executive bid briefs, compliance matrices, corrigenda audit trails, and statutory MSME exemption submissions.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-secondary py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Printer size={14} />
          <span>Print All Records</span>
        </button>
      </div>

      {/* 2. Reports Table / Grid */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] shadow-sm overflow-hidden dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="border-b border-[#E8DED2] bg-[#FAF7F2] p-4 text-xs font-bold text-[#2E2118] flex items-center justify-between dark:border-[#38312A] dark:bg-[#1E1915] dark:text-[#F2EBE1]">
          <span>Generated Intelligence Dossiers</span>
          <span className="text-[#8C8276] text-[11px]">{reportsList.length} documents available</span>
        </div>

        <div className="divide-y divide-[#E8DED2] dark:divide-[#38312A]">
          {reportsList.map((report) => (
            <div
              key={report.id}
              className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-[#FAF7F2] transition dark:hover:bg-[#28231E]/60"
            >
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-[#6B4226] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                    {report.type}
                  </span>
                  <span className="font-mono text-[10px] text-[#8C8276]">
                    Ref: {report.tenderRef}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2 py-0.5 text-[9px] font-bold text-[#2F6B4F]">
                    <CheckCircle2 size={11} /> {report.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                  {report.title}
                </h3>
                <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A] leading-relaxed">
                  {report.description}
                </p>

                <div className="mt-2 flex items-center gap-3 text-[10px] text-[#8C8276]">
                  <span>Generated: {report.generatedDate}</span>
                  <span>·</span>
                  <span>File size: {report.size}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(report.id)}
                  className="btn-primary py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>{downloadingId === report.id ? 'Exporting…' : 'Download (PDF)'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

