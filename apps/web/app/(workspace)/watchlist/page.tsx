'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BellOff,
  Bookmark,
  Clock3,
  ExternalLink,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { TenderTable } from '../../../components/tender-table';
import { DEMO_TENDERS, type TenderOpportunity } from '../../../lib/data';
import { getSavedTenderIds, saveTenderId } from '../../../lib/store';

export default function WatchlistPage() {
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedTenderIds());

  const savedTenders = useMemo(() => {
    return DEMO_TENDERS.filter((t) => savedIds.includes(t.id));
  }, [savedIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-[#38312A] dark:bg-[#221D19]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <Bookmark size={12} />
              Bookmarked Opportunities
            </span>
            <span className="text-xs text-[#8C8276]">·</span>
            <span className="text-xs font-semibold text-[#6B6259] dark:text-[#9E958A]">
              Active Corrigendum Tracking
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            My Saved Tenders ({savedTenders.length})
          </h1>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Tenders you have earmarked for bid preparation. Autonomous agents actively monitor these notices for deadline extensions and corrigenda.
          </p>
        </div>

        <Link
          href="/search"
          className="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
        >
          <span>Discover More Tenders</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {savedTenders.length === 0 ? (
        <div className="rounded-2xl border border-[#E8DED2] bg-[#FFFFFF] p-12 text-center shadow-sm dark:border-[#38312A] dark:bg-[#221D19]">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#F3EEE6] text-[#6B4226] mb-3 dark:bg-[#28231E] dark:text-[#CCAFA0]">
            <Bookmark size={22} />
          </span>
          <h2 className="text-base font-bold text-[#2E2118] dark:text-[#F2EBE1]">
            No tenders in your watchlist yet
          </h2>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A] max-w-md mx-auto">
            Click the bookmark icon on any tender in the table to add it to your watchlist for automated corrigendum monitoring.
          </p>
          <div className="mt-5">
            <Link href="/overview" className="btn-primary py-2 px-4 text-xs font-bold">
              Browse Tender Opportunities
            </Link>
          </div>
        </div>
      ) : (
        <TenderTable tenders={savedTenders} showFilters={false} />
      )}
    </div>
  );
}
