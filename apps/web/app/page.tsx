import { ArrowRight, BadgeCheck, BookOpenCheck, CheckCircle2, FileSearch, ShieldCheck, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '../components/brand-logo';
import { Section, FeatureGrid } from '../components/ui';
import { ThemeToggle } from '../components/theme-toggle';

const features = [
  { icon: FileSearch, label: 'Proof behind every rule', title: 'See the clause, not a guess', body: 'Every extracted condition links back to the exact words in the tender and the public source page.' },
  { icon: BadgeCheck, label: 'Built around your profile', title: 'Know where you stand', body: 'Turnover, experience, location, MSME status, and documents are checked against each tender.' },
  { icon: WalletCards, label: 'Stay ahead of changes', title: 'Catch corrigenda early', body: 'Watch deadlines and eligibility conditions so a change does not catch your team by surprise.' },
];

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-[1320px] items-center justify-between px-5 py-5 sm:px-9">
        <Link href="/" aria-label="TenderGuard home" className="flex items-center rounded-lg"><BrandLogo className="h-auto w-[170px] sm:w-[205px]" priority /></Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle className="border-0 bg-transparent text-[#625d55] hover:bg-white/60 dark:text-[#b19e84] dark:hover:bg-[#2d2924]" />
          <Link href="/login" className="hidden sm:flex rounded-xl px-3 py-2 text-xs font-bold text-[#625d55] hover:bg-white/60 dark:text-[#b19e84] dark:hover:bg-[#2d2924]">Sign in</Link>
          <Link href="/register" className="btn-primary py-2.5 text-xs">Create account <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <Section id="hero" className="relative grid max-w-[1320px] items-center gap-10 px-5 pb-20 pt-12 sm:px-9 lg:grid-cols-[1.1fr_.9fr] lg:pb-28 lg:pt-16">
        <div className="relative z-10 animate-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ded6ca] bg-[#fffefa] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#694d38] dark:border-[#3a342e] dark:bg-[#24201c] dark:text-[#b19e84]"><span className="h-2 w-2 rounded-full bg-[#3f7458] dark:bg-[#8fc3a8]" />Tender intelligence for Indian MSMEs</span>
          <h1 className="mt-7 max-w-3xl text-[clamp(42px,6vw,76px)] font-bold leading-[.99] tracking-[-.055em]">Find the right tender. <span className="text-[#355a78] dark:text-[#8fb3c9]">Know your risk.</span></h1>
          <p className="muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">Other tools find tenders. TenderGuard tells you which ones you'll be rejected for, before you pay the EMD and spend weeks on paperwork—and proves every answer.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/register" className="btn-primary px-5 py-3.5">Check your bid readiness <ArrowRight size={17} /></Link><a href="#how-it-works" className="btn-secondary px-5 py-3.5">See how it works <BookOpenCheck size={16} /></a></div>
          <p className="muted mt-4 text-[11px]">Free to explore with demo tenders · No bidder portal login needed</p>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[#6f6a62] dark:text-[#a49d92]"><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#3f7458] dark:text-[#8fc3a8]" />Exact source evidence</span><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#3f7458] dark:text-[#8fc3a8]" />Public portals only</span><span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-[#3f7458] dark:text-[#8fc3a8]" />MSME-aware analysis</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-[540px] animate-in lg:animate-none">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#e9f0f5] blur-3xl dark:bg-[#2a333d] dark:opacity-50" />
          <div className="absolute -bottom-10 -left-14 h-60 w-60 rounded-full bg-[#eee6d9] blur-3xl dark:bg-[#3d2e26] dark:opacity-50" />
          <div className="surface relative rotate-1 p-4 shadow-[0_32px_90px_rgba(67,53,38,.12)] sm:p-6 dark:shadow-[0_32px_90px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e6e1d8] pb-4 dark:border-[#3a342e]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9f0f5] text-[#355a78] dark:bg-[#2a333d] dark:text-[#8fb3c9]"><FileSearch size={19} /></span><div><p className="text-xs font-extrabold">Tender readiness</p><p className="muted mt-1 text-[10px]">Demo · IT support services</p></div></div><span className="badge badge-bid"><CheckCircle2 size={13} />BID</span></div>
            <div className="flex items-center gap-4 py-5"><div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#3f7458 0deg 342deg,#eae5dc 342deg)' }}><div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-[#fffefa] text-lg font-bold">95</div></div><div><p className="text-sm font-bold">Your profile meets the stated criteria</p><p className="muted mt-1 text-xs leading-5">5 requirements checked · 5 source clauses verified</p></div></div>
            <div className="overflow-hidden rounded-xl border border-[#e6e1d8] dark:border-[#3a342e]">
              <div className="grid grid-cols-[1.1fr_1fr_auto] gap-3 bg-[#f4f1ea] px-3 py-2 text-[9px] font-extrabold uppercase tracking-wide text-[#817b72] dark:bg-[#2d2924] dark:text-[#a49d92]"><span>Requirement</span><span>Tender needs</span><span>Result</span></div>
              {[['Annual turnover', '₹15 lakh minimum', 'PASS'], ['Relevant experience', '1 year', 'PASS'], ['EMD amount', '₹50,000', 'PASS']].map(([name, value, verdict]) => <div key={name} className="grid grid-cols-[1.1fr_1fr_auto] items-center gap-3 border-t border-[#eee9e1] dark:border-[#3a342e] px-3 py-3 text-[10px]"><span className="font-semibold">{name}</span><span className="muted">{value}</span><span className="flex items-center gap-1 font-bold text-[#3f7458] dark:text-[#8fc3a8]"><CheckCircle2 size={12} />{verdict}</span></div>)}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#e9f0f5] p-3 text-[#355a78] dark:bg-[#2a333d] dark:text-[#8fb3c9]"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><p className="text-[10px] leading-4"><b>Evidence verified</b><br />“The bidder shall have average annual turnover of at least Rs. 15 lakh…” <span className="underline underline-offset-2">View source</span></p></div>
            <p className="muted mt-3 text-center text-[9px]">Illustrative demo tender · not a live procurement notice</p>
          </div>
          <div className="surface absolute -bottom-7 -left-5 flex items-center gap-3 px-4 py-3 shadow-lg sm:-left-10"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#fbf0dc] text-[#9a671e]"><span className="text-lg">↗</span></span><div><p className="text-[10px] font-bold">Deadline changed</p><p className="muted text-[9px]">Corrigendum alert · 2 min ago</p></div></div>
        </div>
      </Section>

      <section className="border-y border-[#e6e1d8] dark:border-[#3a342e] bg-[#fffefa] py-5 dark:bg-[#24201c]"><div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 text-[10px] font-bold uppercase tracking-[.13em] text-[#817b72] dark:text-[#a49d92] sm:px-9"><span>Built for small business procurement</span><span className="hidden h-1 w-1 rounded-full bg-[#c3bbad] dark:bg-[#8fb3c9] sm:inline-block" /><span>Evidence first</span><span className="hidden h-1 w-1 rounded-full bg-[#c3bbad] dark:bg-[#8fb3c9] sm:inline-block" /><span>Public information only</span><span className="hidden h-1 w-1 rounded-full bg-[#c3bbad] dark:bg-[#8fb3c9] sm:inline-block" /><span>Human decision stays yours</span></div></section>

      <Section id="how-it-works" className="pt-0">
        <FeatureGrid items={features} />
      </Section>

      <section className="mx-5 mb-10 rounded-[26px] bg-[#355a78] px-6 py-12 text-center text-white sm:mx-9 sm:px-12 lg:mx-auto lg:max-w-[1250px] lg:py-16 dark:bg-[#2a333d]"><p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#c8d9e3]">Start with what you already know</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Build your profile once. Screen every tender with it.</h2><Link href="/register" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#fffefa] px-5 py-3.5 text-sm font-bold text-[#355a78] hover:bg-[#f3f0e9] dark:bg-[#24201c] dark:text-[#b19e84] dark:hover:bg-[#2d2924]">Create your free workspace <ArrowRight size={16} /></Link></section>

      <footer className="mx-auto flex max-w-[1320px] flex-col justify-between gap-3 px-5 pb-8 text-[10px] text-[#817b72] sm:flex-row sm:px-9 dark:text-[#a49d92]"><span>© 2026 TenderGuard AI · Procurement decision support for MSMEs</span><span>Decision support, not legal advice. Verify against the official tender document.</span></footer>
    </main>
  );
}
