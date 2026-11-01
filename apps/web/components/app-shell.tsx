'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Bell, Building2, ChevronDown, CircleHelp, FileSearch, LogOut, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { BrandLogo } from './brand-logo';
import { ThemeToggle } from './theme-toggle';
import { api } from '../lib/api';

type Me = { id: string; email: string; hasProfile: boolean };

const navigation = [
  { href: '/search', label: 'Find tenders', icon: FileSearch },
  { href: '/watchlist', label: 'Watchlist', icon: Activity },
  { href: '/alerts', label: 'Change alerts', icon: Bell },
  { href: '/onboarding', label: 'Business profile', icon: Building2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me'), retry: false });

  useEffect(() => {
    if (session.isError) router.replace('/login');
    else if (session.data && !session.data.hasProfile && pathname !== '/onboarding') router.replace('/onboarding');
  }, [session.isError, session.data, pathname, router]);

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/');
  };

  if (session.isPending || !session.data || (!session.data.hasProfile && pathname !== '/onboarding')) {
    return <div className="grid min-h-screen place-items-center text-sm text-[#777168] dark:text-[#a49d92]">Preparing your workspace…</div>;
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`no-print hidden w-[258px] shrink-0 flex-col border-r border-[#e6e1d8] bg-[#f4f0e8] px-5 py-6 lg:flex dark:border-[#3a342e] dark:bg-[#24201c]`}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <Link href="/" aria-label="TenderGuard home" className="flex items-center"><BrandLogo className="h-auto w-[190px]" priority /></Link>
          <ThemeToggle className="ml-auto h-9 w-9 rounded-full border-0 bg-transparent text-[#694d38] hover:bg-white/60 dark:text-[#b19e84] dark:hover:bg-[#2d2924]" />
        </div>
        <p className="eyebrow mb-3 px-3">Workspace</p>
        <nav className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === '/search' && pathname.startsWith('/tenders/'));
            return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-[#fffefa] text-[#4d382a] shadow-sm dark:bg-[#2d2924] dark:text-[#b19e84] dark:shadow-[0_2px_6px_rgba(0,0,0,0.2)]' : 'text-[#6f6a62] hover:bg-white/70 dark:text-[#9b958a] dark:hover:bg-[#2d2924]'}`}><Icon size={18} />{label}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#e6edf1] p-4 text-[#355a78] dark:bg-[#2a333d] dark:text-[#8fb3c9]">
          <div className="mb-2 flex items-center gap-2"><WalletCards size={17} /><span className="text-xs font-extrabold">Evidence first</span></div>
          <p className="text-xs leading-5 text-[#526b7d] dark:text-[#7a8a96]">Every requirement is tied to the tender text. Review the source before you decide.</p>
          <Link href="/search" className="mt-3 inline-flex items-center gap-1 text-xs font-bold">How it works <ChevronDown size={13} className="-rotate-90" /></Link>
        </div>
        <button onClick={logout} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#746f67] hover:bg-white/70 dark:text-[#9b958a] dark:hover:bg-[#2d2924]"><LogOut size={17} />Sign out</button>
      </aside>
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className={`no-print sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e6e1d8] bg-[#f7f5ef]/95 px-5 backdrop-blur sm:px-8 dark:border-[#3a342e] dark:bg-[#1c1814]/95`}>
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" aria-label="TenderGuard home" className="flex items-center"><BrandLogo className="h-9 w-auto max-w-[170px]" priority /></Link>
            <ThemeToggle className="ml-auto h-9 w-9 rounded-full border-0 bg-transparent text-[#694d38] hover:bg-white/60 dark:text-[#b19e84] dark:hover:bg-[#2d2924]" />
          </div>
          <div className="hidden items-center gap-2 text-xs text-[#777168] lg:flex dark:text-[#a49d92]"><span>Workspace</span><span>/</span><span className="font-semibold text-[#2b2926] dark:text-[#efe5d8]">{navigation.find((item) => pathname.startsWith(item.href))?.label ?? 'Tender detail'}</span></div>
          <div className="flex items-center gap-3">
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#e6e1d8] bg-[#fffefa] px-3 py-2 text-xs font-bold text-[#355a78] dark:border-[#3a342e] dark:bg-[#24201c] dark:text-[#8fb3c9]"><CircleHelp size={15} />Responsible AI</summary>
              <div className="absolute right-0 top-12 z-30 w-[min(340px,calc(100vw-32px))] rounded-2xl border border-[#e6e1d8] bg-[#fffefa] p-4 shadow-xl dark:border-[#3a342e] dark:bg-[#24201c]"><p className="font-bold">A decision aid, with evidence.</p><p className="muted mt-2 text-xs leading-5">TenderGuard reads public tender pages only. It never bypasses CAPTCHAs, signs in as a bidder, or submits bids. A blocked page is marked for a manual step.</p><p className="mt-3 border-t border-[#e6e1d8] pt-3 text-xs font-semibold">Decision support, not legal advice. Verify against the official tender document.</p></div>
            </details>
            <button aria-label="Open notifications" onClick={() => router.push('/alerts')} className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e6e1d8] bg-[#fffefa] text-[#694d38] hover:bg-white dark:border-[#3a342e] dark:bg-[#24201c] dark:text-[#b19e84] dark:hover:bg-[#2d2924]"><Bell size={17} /></button>
            <div className="hidden max-w-48 truncate text-right sm:block"><span className="block text-xs font-bold">{session.data.email}</span><span className="block text-[10px] text-[#817b72] dark:text-[#a49d92]">Business workspace</span></div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-8 sm:py-9">{children}</main>
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#e6e1d8] bg-[#fffefa]/95 px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden dark:border-[#3a342e] dark:bg-[#24201c]/95">
          {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold ${pathname.startsWith(href) ? 'text-[#694d38]' : 'text-[#888176]'}`}><Icon size={19} /><span>{label === 'Find tenders' ? 'Search' : label === 'Business profile' ? 'Profile' : label.split(' ')[0]}</span></Link>)}
        </nav>
      </div>
    </div>
  );
}
