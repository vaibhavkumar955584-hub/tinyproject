import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`surface ${className}`}>{children}</section>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow mb-2">{eyebrow}</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="muted mt-2 max-w-2xl text-sm leading-6">{description}</p>}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <Card className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f0f5] text-[#355a78]">{icon}</span><h2 className="text-lg font-bold">{title}</h2><p className="muted mt-2 max-w-md text-sm leading-6">{body}</p>{action && <div className="mt-5">{action}</div>}</Card>;
}
