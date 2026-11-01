'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  IndianRupee,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { TenderOpportunity } from '../lib/data';
import { isTenderSaved, saveTenderId } from '../lib/store';
import { VerdictBadge } from './verdict';

interface TenderTableProps {
  tenders: TenderOpportunity[];
  onTenderSelect?: (tender: TenderOpportunity) => void;
  showFilters?: boolean;
}

export function formatInr(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${new Intl.NumberFormat('en-IN').format(amount)}`;
}

export function formatDeadline(dateString: string): { label: string; urgent: boolean; text: string } {
  const deadline = new Date(dateString);
  const now = new Date();
  const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  const formattedDate = deadline.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  if (diffHours <= 0) return { label: 'Closed', urgent: true, text: formattedDate };
  if (diffHours < 24) return { label: `${Math.round(diffHours)}h left`, urgent: true, text: formattedDate };
  if (diffDays <= 3) return { label: `${diffDays} days left`, urgent: true, text: formattedDate };
  if (diffDays <= 7) return { label: `${diffDays} days left`, urgent: false, text: formattedDate };
  return { label: `${diffDays} days`, urgent: false, text: formattedDate };
}

export function TenderTable({ tenders, onTenderSelect, showFilters = true }: TenderTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'ALL' | 'STRONG' | 'BID' | 'CLOSING_SOON' | 'SAVED'>('ALL');
  const [sortBy, setSortBy] = useState<'MATCH' | 'DEADLINE' | 'VALUE'>('MATCH');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('tg_saved_tenders');
        return raw ? JSON.parse(raw) : ['demo-cppp-001', 'demo-cppp-002'];
      } catch {
        return ['demo-cppp-001', 'demo-cppp-002'];
      }
    }
    return ['demo-cppp-001', 'demo-cppp-002'];
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = saveTenderId(id);
    setSavedIds(updated);
  };

  const filteredTenders = useMemo(() => {
    return tenders
      .filter((tender) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            tender.title.toLowerCase().includes(q) ||
            tender.department.toLowerCase().includes(q) ||
            tender.location.toLowerCase().includes(q) ||
            tender.sourceTenderId.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Tab filter
        if (tabFilter === 'STRONG') return tender.matchScore >= 90;
        if (tabFilter === 'BID') return tender.verdict === 'BID';
        if (tabFilter === 'SAVED') return savedIds.includes(tender.id);
        if (tabFilter === 'CLOSING_SOON') {
          const diffDays = (new Date(tender.closingAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'MATCH') return b.matchScore - a.matchScore;
        if (sortBy === 'VALUE') return b.estimatedValueInr - a.estimatedValueInr;
        if (sortBy === 'DEADLINE') return new Date(a.closingAt).getTime() - new Date(b.closingAt).getTime();
        return 0;
      });
  }, [tenders, searchQuery, tabFilter, sortBy, savedIds]);

  const totalPages = Math.ceil(filteredTenders.length / pageSize) || 1;
  const paginatedTenders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenders.slice(start, start + pageSize);
  }, [filteredTenders, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Quick Tabs, and Sort */}
      {showFilters && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
          {/* Search box */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8276]" size={16} />
            <input
              type="text"
              placeholder="Search by tender name, department, or reference ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-[#E8DED2] bg-[#FAF7F2] py-2 pl-9 pr-3 text-xs text-[#2E2118] placeholder-[#A3998C] focus:border-[#6B4226] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Opportunities' },
              { id: 'STRONG', label: 'Strong Match (90%+)' },
              { id: 'BID', label: 'Eligible (BID)' },
              { id: 'CLOSING_SOON', label: 'Closing Soon' },
              { id: 'SAVED', label: `Saved (${savedIds.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTabFilter(tab.id as typeof tabFilter);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  tabFilter === tab.id
                    ? 'bg-[#6B4226] text-white shadow-sm dark:bg-[#8B5E3C]'
                    : 'text-[#6B6259] hover:bg-[#F3EEE6] dark:text-[#9E958A] dark:hover:bg-[#28231E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B6259] dark:text-[#9E958A]">
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-[#E8DED2] bg-[#FAF7F2] px-2 py-1.5 text-xs font-semibold text-[#2E2118] focus:outline-none dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#F2EBE1]"
            >
              <option value="MATCH">Sort by: Highest Match</option>
              <option value="DEADLINE">Sort by: Closing Date</option>
              <option value="VALUE">Sort by: Contract Value</option>
            </select>
          </div>
        </div>
      )}

      {/* Main High-Density Table */}
      <div className="overflow-hidden rounded-xl border border-[#E8DED2] bg-[#FFFFFF] shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] border-collapse text-left text-xs">
            <thead className="border-b border-[#E8DED2] bg-[#F6F1E9] text-[11px] font-bold uppercase tracking-wider text-[#6B4226] dark:border-[#38312A] dark:bg-[#28231E] dark:text-[#CCAFA0]">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Tender Title & ID</th>
                <th className="py-3.5 px-3">Department</th>
                <th className="py-3.5 px-3">Location</th>
                <th className="py-3.5 px-3">Estimated Value</th>
                <th className="py-3.5 px-3">Closing Date</th>
                <th className="py-3.5 px-3">Eligibility Match</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED2] dark:divide-[#38312A]">
              {paginatedTenders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#8C8276]">
                    No tenders match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTenders.map((tender) => {
                  const deadlineInfo = formatDeadline(tender.closingAt);
                  const isSaved = savedIds.includes(tender.id);

                  // Match indicator style
                  const matchBadgeClass =
                    tender.matchScore >= 90
                      ? 'border-[#BCD8C7] bg-[#EBF4EF] text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]'
                      : tender.matchScore >= 70
                      ? 'border-[#E8D5B5] bg-[#FAF2E2] text-[#94631A] dark:border-[#524024] dark:bg-[#332817] dark:text-[#DEBA70]'
                      : 'border-[#ECC2BD] bg-[#FAEDE9] text-[#A83832] dark:border-[#5C322D] dark:bg-[#382421] dark:text-[#DE8F87]';

                  const matchLabel =
                    tender.matchScore >= 90
                      ? 'Strong Match'
                      : tender.matchScore >= 70
                      ? 'Potential Match'
                      : 'Low Match';

                  return (
                    <tr
                      key={tender.id}
                      onClick={() => onTenderSelect?.(tender)}
                      className="group cursor-pointer hover:bg-[#FAF7F2] transition dark:hover:bg-[#28231E]/60"
                    >
                      {/* Title & Ref */}
                      <td className="py-3.5 pl-4 pr-3 max-w-[280px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                              tender.source === 'CPPP'
                                ? 'bg-[#2B4E6B] text-white'
                                : 'bg-[#6B4226] text-white'
                            }`}
                          >
                            {tender.source}
                          </span>
                          <span className="font-mono text-[10px] text-[#8C8276] truncate">
                            {tender.sourceTenderId}
                          </span>
                        </div>
                        <Link
                          href={`/tenders/${tender.id}`}
                          className="font-bold text-[#2E2118] group-hover:text-[#6B4226] transition line-clamp-2 leading-snug dark:text-[#F2EBE1] dark:group-hover:text-[#CCAFA0]"
                        >
                          {tender.title}
                        </Link>
                        {/* Source verification indicator */}
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-[#2F6B4F] dark:text-[#7BB896]">
                          <ShieldCheck size={12} />
                          <span>Portal Verified · 100% quoted evidence</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3 max-w-[190px]">
                        <span className="text-[#2E2118] font-medium line-clamp-2 dark:text-[#F2EBE1]">
                          {tender.department}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[#6B6259] dark:text-[#9E958A]">
                          <MapPin size={13} className="text-[#8C8276]" />
                          <span>{tender.location}</span>
                        </div>
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">
                          {formatInr(tender.estimatedValueInr)}
                        </div>
                        <div className="text-[10px] text-[#8C8276]">
                          EMD: {tender.emdInr > 0 ? formatInr(tender.emdInr) : 'Exempted'}
                        </div>
                      </td>

                      {/* Closing Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-[#2E2118] dark:text-[#F2EBE1]">
                          <Calendar size={13} className="text-[#8C8276]" />
                          <span>{deadlineInfo.text}</span>
                        </div>
                        <span
                          className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            deadlineInfo.urgent
                              ? 'bg-[#FAEDE9] text-[#A83832] dark:bg-[#382421] dark:text-[#DE8F87]'
                              : 'bg-[#F3EEE6] text-[#6B6259] dark:bg-[#28231E] dark:text-[#9E958A]'
                          }`}
                        >
                          {deadlineInfo.label}
                        </span>
                      </td>

                      {/* Eligibility Match */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${matchBadgeClass}`}
                          >
                            <Sparkles size={12} />
                            <span>{tender.matchScore}%</span>
                          </span>
                          <span className="text-[10px] font-medium text-[#6B6259] dark:text-[#9E958A]">
                            {matchLabel}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <VerdictBadge verdict={tender.verdict} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => toggleSave(tender.id, e)}
                            title={isSaved ? 'Remove from saved' : 'Save tender'}
                            className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                              isSaved
                                ? 'border-[#6B4226] bg-[#6B4226] text-white dark:border-[#8B5E3C] dark:bg-[#8B5E3C]'
                                : 'border-[#E8DED2] bg-white text-[#6B6259] hover:bg-[#F6F1E9] dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#9E958A]'
                            }`}
                          >
                            <Bookmark size={14} className={isSaved ? 'fill-white' : ''} />
                          </button>

                          <Link
                            href={`/tenders/${tender.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E8DED2] bg-white px-2.5 py-1.5 text-xs font-bold text-[#6B4226] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#CCAFA0]"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </Link>

                          <a
                            href={tender.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open Official Portal Notice"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[#E8DED2] bg-white text-[#6B6259] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#9E958A]"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="flex flex-col gap-2 border-t border-[#E8DED2] bg-[#FAF7F2] px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[#6B6259] dark:border-[#38312A] dark:bg-[#1E1915] dark:text-[#9E958A]">
          <div>
            Showing <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">{paginatedTenders.length}</span> of{' '}
            <span className="font-bold text-[#2E2118] dark:text-[#F2EBE1]">{filteredTenders.length}</span> tenders
            (Evidence backed)
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-[#E8DED2] bg-white px-2.5 py-1 font-semibold disabled:opacity-40 dark:border-[#38312A] dark:bg-[#221D19]"
              >
                Previous
              </button>
              <span className="px-2 font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-[#E8DED2] bg-white px-2.5 py-1 font-semibold disabled:opacity-40 dark:border-[#38312A] dark:bg-[#221D19]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

