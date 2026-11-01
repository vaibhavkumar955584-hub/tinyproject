export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">TenderGuard AI</p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Know your bid risks before you commit.</h1>
      <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">Phase 0 workspace scaffold is ready. Evidence-backed tender analysis and monitoring are coming in the next phases.</p>
      <p className="max-w-2xl rounded-xl border border-teal-700/20 bg-teal-700/5 p-4 text-sm">Decision support, not legal advice. Verify against the official tender document.</p>
    </main>
  );
}
