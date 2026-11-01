'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Bookmark,
  Bot,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Compass,
  ExternalLink,
  FileCheck2,
  FileSearch,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { BrandLogo } from './brand-logo';
import { ThemeToggle } from './theme-toggle';
import { api } from '../lib/api';
import { DEMO_PROFILE, DEMO_ALERTS } from '../lib/data';
import { isDemoSessionActive, setDemoSessionActive } from '../lib/store';

type Me = { id: string; email: string; hasProfile: boolean };

const navigation = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/search', label: 'Discover Tenders', icon: Compass },
  { href: '/watchlist', label: 'My Saved Tenders', icon: Bookmark },
  { href: '/eligibility', label: 'Eligibility Analysis', icon: ShieldCheck },
  { href: '/bid-readiness', label: 'Bid Readiness', icon: ClipboardList },
  { href: '/monitoring', label: 'Tender Monitoring', icon: Radio },
  { href: '/agent-activity', label: 'AI Agent Activity', icon: Bot },
  { href: '/reports', label: 'Reports & Documents', icon: FileText },
  { href: '/profile', label: 'Business Profile', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const session = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/auth/me'),
    retry: false,
  });

  const isDemo = session.isError || !session.data || isDemoSessionActive();
  const currentUserEmail = session.data?.email || DEMO_PROFILE.email;
  const currentCompanyName = session.data?.hasProfile ? 'Your Business' : DEMO_PROFILE.companyName;

  const logout = async () => {
    setDemoSessionActive(false);
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/');
  };

  const currentPageTitle =
    navigation.find((item) => pathname === item.href || (item.href === '/search' && pathname.startsWith('/tenders/')))
      ?.label ?? 'Workspace';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2118] dark:bg-[#1A1613] dark:text-[#F2EBE1]">
      <div className="flex min-h-screen">
        {/* Fixed Desktop Sidebar */}
        <aside
          className="no-print hidden w-[260px] shrink-0 flex-col border-r border-[#E8DED2] bg-[#F3EEE6] px-4 py-5 lg:flex dark:border-[#38312A] dark:bg-[#1E1915]"
          style={{ minHeight: '100vh' }}
        >
          {/* Logo & Tagline */}
          <div className="px-2 pb-5 border-b border-[#E8DED2] dark:border-[#38312A]">
            <Link href="/overview" className="flex items-center gap-2">
              <BrandLogo className="h-auto w-[180px]" priority />
            </Link>
            <p className="mt-1 text-[11px] font-semibold tracking-wide text-[#6B4226] dark:text-[#B8977E]">
              Find. Analyze. Win.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <p className="eyebrow mb-2 px-3 text-[10px] tracking-wider text-[#6B4226] opacity-80 dark:text-[#B8977E]">
              Intelligence Platform
            </p>
            <nav className="space-y-1">
              {navigation.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href === '/overview' && pathname === '/') ||
                  (href === '/search' && pathname.startsWith('/tenders/')) ||
                  (href === '/monitoring' && pathname === '/alerts') ||
                  (href === '/profile' && pathname === '/onboarding');

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#FFFFFF] text-[#6B4226] shadow-sm font-bold border border-[#E8DED2] dark:bg-[#28231E] dark:text-[#CCAFA0] dark:border-[#38312A]'
                        : 'text-[#6B6259] hover:bg-[#EFE8DD] hover:text-[#2E2118] dark:text-[#9E958A] dark:hover:bg-[#28231E] dark:hover:text-[#F2EBE1]'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? 'text-[#6B4226] dark:text-[#CCAFA0]' : 'text-[#8C8276] dark:text-[#756D63]'}
                    />
                    <span>{label}</span>
                    {href === '/monitoring' && (
                      <span className="ml-auto flex h-2 w-2 rounded-full bg-[#2F6B4F] ring-4 ring-[#2F6B4F]/20" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom MSME Context & Status */}
          <div className="mt-auto pt-4 border-t border-[#E8DED2] dark:border-[#38312A] space-y-3">
            <div className="rounded-xl border border-[#BCD8C7] bg-[#EBF4EF] p-3 text-[11px] text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} /> MSME Active
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-white/70 px-1.5 py-0.5 rounded border border-[#BCD8C7] dark:bg-black/30 dark:border-[#2D543D]">
                  {DEMO_PROFILE.msmeStatus}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-[#3E5C4A] dark:text-[#8CB89C] truncate">
                {DEMO_PROFILE.category}
              </p>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#2F6B4F] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#6B6259] dark:text-[#9E958A]">TinyFish Agent Ready</span>
              </div>
              <ThemeToggle className="h-8 w-8 rounded-lg border-0 bg-transparent text-[#6B4226] hover:bg-[#EFE8DD] dark:text-[#B8977E] dark:hover:bg-[#28231E]" />
            </div>

            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#6B6259] hover:bg-[#EFE8DD] hover:text-[#A83832] transition dark:text-[#9E958A] dark:hover:bg-[#28231E]"
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header and Drawer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E8DED2] bg-[#FAF7F2]/95 px-4 backdrop-blur sm:px-8 dark:border-[#38312A] dark:bg-[#1A1613]/95">
            {/* Left: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#E8DED2] bg-[#FFFFFF] text-[#2E2118] lg:hidden dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1]"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <Link
                  href="/overview"
                  className="font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
                >
                  TenderGuard
                </Link>
                <span className="text-[#A3998C]">/</span>
                <span className="font-semibold text-[#2E2118] dark:text-[#F2EBE1]">{currentPageTitle}</span>
              </div>
            </div>

            {/* Center: Live Agent Activity Indicator */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-[#BCD8C7] bg-[#EBF4EF] px-3 py-1 text-xs font-medium text-[#2F6B4F] dark:border-[#2D543D] dark:bg-[#202E26] dark:text-[#7BB896]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F6B4F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F6B4F]"></span>
              </span>
              <span>TinyFish Agent: Live Portal Radar (CPPP & GeM)</span>
            </div>

            {/* Right: Quick actions, notifications, user profile */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/search"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#E8DED2] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#2E2118] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1]"
              >
                <Search size={14} className="text-[#6B6259]" />
                <span>Search Tenders</span>
              </Link>

              {/* Notification Popover */}
              <div className="relative">
                <button
                  onClick={() => setAlertsOpen(!alertsOpen)}
                  className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#E8DED2] bg-[#FFFFFF] text-[#2E2118] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1]"
                  aria-label="View notifications"
                >
                  <Bell size={16} />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#A83832] text-[9px] font-bold text-white">
                    2
                  </span>
                </button>

                {alertsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-3 shadow-xl dark:border-[#38312A] dark:bg-[#221D19]">
                    <div className="flex items-center justify-between border-b border-[#E8DED2] pb-2 dark:border-[#38312A]">
                      <span className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">Corrigendum Alerts</span>
                      <Link
                        href="/monitoring"
                        onClick={() => setAlertsOpen(false)}
                        className="text-[10px] font-bold text-[#6B4226] hover:underline dark:text-[#B8977E]"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="mt-2 space-y-2 max-h-64 overflow-y-auto text-xs">
                      {DEMO_ALERTS.map((alert) => (
                        <Link
                          key={alert.id}
                          href="/monitoring"
                          onClick={() => setAlertsOpen(false)}
                          className="block rounded-lg p-2 hover:bg-[#FAF7F2] transition dark:hover:bg-[#28231E]"
                        >
                          <div className="flex items-center gap-1.5 font-semibold text-[#6B4226] dark:text-[#B8977E]">
                            <Radio size={12} className="text-[#2F6B4F]" />
                            <span>{alert.changeType === 'DEADLINE' ? 'Deadline Extended' : 'Turnover Condition Relaxed'}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#6B6259] dark:text-[#9E958A] line-clamp-1">
                            {alert.tender.title}
                          </p>
                          <p className="mt-1 text-[10px] text-[#A3998C]">Tender Ref: {alert.tender.source}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 rounded-lg border border-[#E8DED2] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-semibold text-[#2E2118] hover:bg-[#F6F1E9] transition dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1]"
                >
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-[#F3EEE6] text-[#6B4226] font-bold text-[11px] dark:bg-[#28231E] dark:text-[#CCAFA0]">
                    AI
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block font-bold leading-tight">{currentCompanyName}</span>
                    <span className="block text-[10px] text-[#2F6B4F] font-semibold dark:text-[#7BB896]">
                      Small MSME · UP
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-[#8C8276]" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] p-2 shadow-xl dark:border-[#38312A] dark:bg-[#221D19]">
                    <div className="p-2 border-b border-[#E8DED2] dark:border-[#38312A]">
                      <p className="text-xs font-bold text-[#2E2118] dark:text-[#F2EBE1]">{DEMO_PROFILE.companyName}</p>
                      <p className="text-[10px] text-[#6B6259] dark:text-[#9E958A] truncate">{currentUserEmail}</p>
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs">
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#FAF7F2] transition dark:hover:bg-[#28231E]"
                      >
                        <Building2 size={14} /> Business Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#FAF7F2] transition dark:hover:bg-[#28231E]"
                      >
                        <Settings size={14} /> Settings & API
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[#A83832] hover:bg-[#FAEDE9] transition dark:hover:bg-[#382421]"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-[280px] flex-col bg-[#F3EEE6] p-5 shadow-2xl dark:bg-[#1E1915]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DED2] dark:border-[#38312A]">
              <BrandLogo className="h-auto w-[160px]" priority />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1 text-[#6B6259] hover:bg-[#EFE8DD] dark:text-[#9E958A]"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                    pathname === href
                      ? 'bg-[#FFFFFF] text-[#6B4226] font-bold shadow-sm dark:bg-[#28231E] dark:text-[#CCAFA0]'
                      : 'text-[#6B6259] hover:bg-[#EFE8DD] dark:text-[#9E958A]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="pt-4 border-t border-[#E8DED2] dark:border-[#38312A]">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#A83832]"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
