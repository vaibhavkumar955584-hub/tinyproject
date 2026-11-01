'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  FileUp,
  FileWarning,
  Info,
  Layers,
  Printer,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { DEMO_TENDERS, DEMO_READINESS_DOCS, type ReadinessDocument } from '../../../lib/data';
import { getStoredDocuments, saveStoredDocument } from '../../../lib/store';

export default function BidReadinessPage() {
  const [selectedTenderId, setSelectedTenderId] = useState(DEMO_TENDERS[0]!.id);
  const [documents, setDocuments] = useState<ReadinessDocument[]>(() => getStoredDocuments());
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const tender = (DEMO_TENDERS.find((t) => t.id === selectedTenderId) ?? DEMO_TENDERS[0])!;

  // Calculate readiness score
  const requiredDocs = documents.filter((d) => d.required);
  const verifiedRequired = requiredDocs.filter((d) => d.status === 'VERIFIED');
  const readinessPercentage = Math.round((verifiedRequired.length / (requiredDocs.length || 1)) * 100);

  const simulateUpload = (docId: string) => {
    const updated = saveStoredDocument(docId, {
      status: 'VERIFIED',
      uploadedFile: {
        name: `${documents.find((d) => d.id === docId)?.name.substring(0, 15) ?? 'Document'}_Uploaded.pdf`,
        size: '1.4 MB',
        date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    });
    setDocuments(updated);
    setUploadNotice('Document verified and stamped. Readiness score updated.');
    setTimeout(() => setUploadNotice(null), 3500);
  };

  const removeUpload = (docId: string) => {
    const updated = saveStoredDocument(docId, {
      status: 'PENDING',
      uploadedFile: null,
    });
    setDocuments(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <FileCheck2 size={12} />
              Tender Submission Gatekeeper
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              Pre-Qualification Verification
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            Bid Readiness & Compliance Checklist
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Audit statutory, financial, and technical documents to guarantee zero rejection during technical envelope opening.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print Checklist (PDF)</span>
          </button>
          <button
            onClick={() => {
              setUploadNotice('Compiling readiness dossier ZIP archive with verified attachments…');
              setTimeout(() => setUploadNotice('Dossier ZIP ready: TenderGuard_Bid_Dossier_2026.zip (14.2 MB)'), 1500);
            }}
            className="btn-primary py-2 px-3.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Download size={14} />
            <span>Export Bid Pack (ZIP)</span>
          </button>
        </div>
      </div>

      {uploadNotice && (
        <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-3 text-xs font-semibold text-[#2F6B4F] flex items-center justify-between dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            {uploadNotice}
          </span>
          <button onClick={() => setUploadNotice(null)} className="text-[10px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Prominent Bid Readiness Score Gauge & Tender Context */}
      <div className="rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Readiness Gauge */}
          <div className="flex items-center gap-5">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[#2F6B4F] bg-[#FAF7F2] dark:border-[#7BB896] dark:bg-[#1A1613]">
              <div className="text-center">
                <span className="block text-2xl font-black text-[#2F6B4F] dark:text-[#7BB896]">
                  {readinessPercentage}%
                </span>
                <span className="block text-[8px] font-bold uppercase text-[#8C8276]">
                  READY
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                    readinessPercentage >= 85
                      ? 'border-[#BCD8C7] bg-[#EBF4EF] text-[#2F6B4F]'
                      : 'border-[#E8D5B5] bg-[#FAF2E2] text-[#94631A]'
                  }`}
                >
                  {readinessPercentage >= 85 ? 'HIGH READINESS' : 'ACTION REQUIRED'}
                </span>
                <span className="text-xs text-[#8C8276]">
                  {verifiedRequired.length} of {requiredDocs.length} mandatory documents verified
                </span>
              </div>
              <h2 className="mt-2 text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                {readinessPercentage >= 85
                  ? 'Your submission envelope is nearly complete.'
                  : 'Critical affidavit and board resolution documents require upload.'}
              </h2>
              <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A] max-w-xl">
                Tender: <b>{tender.title}</b> ({tender.sourceTenderId})
              </p>
            </div>
          </div>

          {/* Tender Switcher */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <label className="text-[11px] font-bold text-[#6B6259] dark:text-[#9E958A]">
              Screening Checklist for Tender:
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => setSelectedTenderId(e.target.value)}
              className="rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 px-3 text-xs font-bold text-[#2E2118] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1] max-w-xs"
            >
              {DEMO_TENDERS.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.source}] {t.sourceTenderId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Structured Document Checklist Table */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] shadow-sm overflow-hidden dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="border-b border-[#E8DED2] bg-[#FAF7F2] p-4 text-xs font-bold text-[#2E2118] flex items-center justify-between dark:border-[#38312A] dark:bg-[#1E1915] dark:text-[#F2EBE1]">
          <span>Required Document Dossier & Verification Gate</span>
          <span className="text-[#8C8276] text-[11px]">7 items total · 1 optional bonus</span>
        </div>

        <div className="divide-y divide-[#E8DED2] dark:divide-[#38312A]">
          {documents.map((doc) => {
            const isVerified = doc.status === 'VERIFIED';

            return (
              <div
                key={doc.id}
                className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-[#FAF7F2] transition dark:hover:bg-[#28231E]/60"
              >
                {/* Left: Document details and why required */}
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded bg-[#6B4226] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        doc.required ? 'text-[#A83832] dark:text-[#DE8F87]' : 'text-[#8C8276]'
                      }`}
                    >
                      {doc.required ? 'MANDATORY' : 'OPTIONAL (BONUS)'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        isVerified
                          ? 'border-[#BCD8C7] bg-[#EBF4EF] text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]'
                          : 'border-[#E8D5B5] bg-[#FAF2E2] text-[#94631A] dark:border-[#524024] dark:bg-[#332817] dark:text-[#DEBA70]'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle2 size={12} /> VERIFIED
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> PENDING UPLOAD
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    {doc.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A] leading-relaxed">
                    {doc.reason}
                  </p>

                  {doc.supportingClause && (
                    <p className="mt-2 text-[10px] font-mono text-[#6B4226] bg-[#F6F1E9] p-1.5 rounded dark:bg-[#28231E] dark:text-[#CCAFA0]">
                      Tender Clause: “{doc.supportingClause}”
                    </p>
                  )}
                </div>

                {/* Right: Upload Action & Stamped Status */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  {isVerified && doc.uploadedFile ? (
                    <div className="rounded-lg border border-[#BCD8C7] bg-[#EBF4EF] p-2.5 text-xs dark:border-[#2D543D] dark:bg-[#202E26]">
                      <div className="flex items-center gap-2 font-bold text-[#2F6B4F] dark:text-[#7BB896]">
                        <FileCheck2 size={14} />
                        <span className="truncate max-w-[170px]">{doc.uploadedFile.name}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-[#3E5C4A] dark:text-[#8CB89C]">
                        <span>{doc.uploadedFile.size} · {doc.uploadedFile.date}</span>
                        <button
                          onClick={() => removeUpload(doc.id)}
                          className="ml-3 text-[#A83832] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => simulateUpload(doc.id)}
                      className="btn-secondary py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <UploadCloud size={14} className="text-[#6B4226] dark:text-[#CCAFA0]" />
                      <span>Upload & Verify Document</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Legal Compliance & Notarization Advice */}
      <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm text-xs dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="flex items-center gap-2 border-b border-[#E8DED2] pb-3 mb-3 font-bold text-[#2E2118] dark:border-[#38312A] dark:text-[#F2EBE1]">
          <ShieldAlert size={16} className="text-[#94631A] dark:text-[#DEBA70]" />
          <span>Statutory Rules for Indian Government Procurement Submissions</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-[#6B6259] dark:text-[#9E958A] leading-relaxed">
          <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
            <b className="text-[#2E2118] dark:text-[#F2EBE1] block mb-1">
              CA UDIN Verification
            </b>
            All audited turnover balance sheets must contain an active 18-digit Unique Document Identification Number (UDIN) issued by ICAI.
          </div>
          <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
            <b className="text-[#2E2118] dark:text-[#F2EBE1] block mb-1">
              Affidavit Stamp Value
            </b>
            The Non-Blacklisting affidavit must be drafted on minimum ₹100 non-judicial e-stamp paper and attested by a First Class Magistrate or Notary Public.
          </div>
          <div className="rounded-lg bg-[#FAF7F2] p-3 dark:bg-[#1A1613]">
            <b className="text-[#2E2118] dark:text-[#F2EBE1] block mb-1">
              Class 3 DSC Requirement
            </b>
            Final bid encryption and cryptographic signing on CPPP / GeM portal strictly requires a valid Class 3 Digital Signature Certificate.
          </div>
        </div>
      </div>
    </div>
  );
}

