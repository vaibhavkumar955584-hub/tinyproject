'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  IndianRupee,
  MapPin,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DEMO_PROFILE } from '../../../lib/data';
import { formatInr } from '../../../components/tender-table';

export default function ProfilePage() {
  const [profile, setProfile] = useState(DEMO_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <ShieldCheck size={12} />
              MSME Master Profile
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              Baseline for Eligibility Screening
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            Business Profile & Credentials
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Keep your turnover, experience, and registration numbers updated. TinyFish screens public tenders strictly against these credentials.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-secondary py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Pencil size={14} />
          <span>{isEditing ? 'Cancel Editing' : 'Edit Business Profile'}</span>
        </button>
      </div>

      {saveNotice && (
        <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-3 text-xs font-semibold text-[#2F6B4F] flex items-center gap-2 dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
          <CheckCircle2 size={16} />
          <span>Profile saved successfully. All eligibility scores recalibrated.</span>
        </div>
      )}

      {/* 2. Main Profile Form / View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Core Enterprise Info (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-4">
            Corporate & Financial Parameters
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
                  Company Legal Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
                  />
                ) : (
                  <div className="rounded-lg bg-[#FAF7F2] p-2.5 font-bold text-[#2E2118] dark:bg-[#1A1613] dark:text-[#F2EBE1]">
                    {profile.companyName}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
                  Primary Business Category
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.category}
                    onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                    className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
                  />
                ) : (
                  <div className="rounded-lg bg-[#FAF7F2] p-2.5 font-bold text-[#2E2118] dark:bg-[#1A1613] dark:text-[#F2EBE1]">
                    {profile.category}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
                  Registered State / Operating Hub
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
                  />
                ) : (
                  <div className="rounded-lg bg-[#FAF7F2] p-2.5 font-bold text-[#2E2118] dark:bg-[#1A1613] dark:text-[#F2EBE1]">
                    {profile.state}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
                  Annual Turnover (Average Last 3 Yrs)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.annualTurnoverInr}
                    onChange={(e) => setProfile({ ...profile, annualTurnoverInr: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
                  />
                ) : (
                  <div className="rounded-lg bg-[#FAF7F2] p-2.5 font-bold text-[#2E2118] dark:bg-[#1A1613] dark:text-[#F2EBE1]">
                    {formatInr(profile.annualTurnoverInr)}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
                  Relevant Operating Experience
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.experienceYears}
                    onChange={(e) => setProfile({ ...profile, experienceYears: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] p-2 text-xs dark:border-[#38312A] dark:bg-[#1A1613]"
                  />
                ) : (
                  <div className="rounded-lg bg-[#FAF7F2] p-2.5 font-bold text-[#2E2118] dark:bg-[#1A1613] dark:text-[#F2EBE1]">
                    {profile.experienceYears} Years
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#2E2118] mb-1 dark:text-[#F2EBE1]">
                  MSME Classification
                </label>
                <div className="rounded-lg bg-[#EBF4EF] p-2.5 font-bold text-[#2F6B4F] border border-[#BCD8C7] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
                  {profile.msmeStatus} Enterprise (Registered)
                </div>
              </div>
            </div>

            {/* Statutory Registrations */}
            <div className="pt-4 border-t border-[#E8DED2] dark:border-[#38312A]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-3">
                Government Tax & Registration IDs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                  <span className="text-[10px] text-[#8C8276] block">Udyam Registration</span>
                  <span className="font-mono font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    {profile.udyam}
                  </span>
                </div>
                <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                  <span className="text-[10px] text-[#8C8276] block">GSTIN</span>
                  <span className="font-mono font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    {profile.gstin}
                  </span>
                </div>
                <div className="rounded-lg bg-[#FAF7F2] p-2.5 dark:bg-[#1A1613]">
                  <span className="text-[10px] text-[#8C8276] block">Company PAN</span>
                  <span className="font-mono font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                    {profile.pan}
                  </span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Held Certificates & Profile Strength (1 Col) */}
        <div className="space-y-5">
          {/* Profile Strength */}
          <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-5 shadow-sm dark:border-[#2D543D] dark:bg-[#202E26]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6B4F] dark:text-[#7BB896]">
              Profile Screening Strength
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#2F6B4F] dark:text-[#7BB896]">
                100%
              </span>
              <span className="text-xs font-semibold text-[#3E5C4A] dark:text-[#8CB89C]">
                All mandatory keys present
              </span>
            </div>
            <p className="mt-2 text-xs text-[#3E5C4A] dark:text-[#8CB89C] leading-relaxed">
              Your profile contains all statutory credentials required to execute zero-hallucination deterministic eligibility checks.
            </p>
          </div>

          {/* Held Certifications */}
          <div className="rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-5 shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E] mb-3">
              Held Certifications ({profile.certifications.length})
            </h3>
            <div className="space-y-2 text-xs">
              {profile.certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex items-center gap-2 rounded-lg bg-[#FAF7F2] p-2 dark:bg-[#1A1613]"
                >
                  <BadgeCheck size={16} className="text-[#2F6B4F] shrink-0" />
                  <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

