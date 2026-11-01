import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export function Card({ children, className = '', padding = 'p-5 sm:p-6' }: { children: ReactNode; className?: string; padding?: string }) {
  return <section className={`surface ${padding} ${className}`}>{children}</section>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="muted mt-2 max-w-2xl text-sm leading-6">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="flex min-h-[64px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f0f5] text-[#355a78]">{icon}</span>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="muted mt-2 max-w-md text-sm leading-6">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  disabled,
  size = 'md',
  type = 'button',
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
} & Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'className' | 'disabled' | 'type'> & { disabled?: boolean; type?: ComponentPropsWithoutRef<'button'>['type'] }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-[#694d38] text-[#fffdf7] shadow-sm hover:bg-[#4d382a] dark:bg-[#4d382a] dark:hover:bg-[#694d38]',
    secondary: 'border border-[#e6e1d8] bg-[#fffefa] text-[#2b2926] hover:bg-[#f3f0e9] dark:border-[#3a342e] dark:bg-[#24201c] dark:hover:bg-[#2d2924]',
    ghost: 'text-[#694d38] hover:bg-white/60 dark:text-[#b19e84] dark:hover:bg-[#2d2924]',
    danger: 'border border-[#efc7c2] bg-[#fbefed] text-[#b9473f] hover:bg-[#f8eae7] dark:border-[#3d2622] dark:bg-[#3d2622] dark:hover:bg-[#4d2e29]',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-xs',
    lg: 'px-5 py-3.5 text-sm',
  };
  return (
    <button {...props} type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }: ComponentPropsWithoutRef<'input'>) {
  return <input className={`field ${className}`} {...props} />;
}

export function Label({ children, htmlFor, className = '' }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return <label htmlFor={htmlFor} className={`mb-2 block text-xs font-bold ${className}`}>{children}</label>;
}

export function Section({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-[1320px] px-5 py-16 sm:px-9 lg:py-24 ${className}`}>
      {children}
    </section>
  );
}

type LucideIcon = React.ComponentType<ComponentPropsWithoutRef<typeof import('lucide-react').CheckCircle2>>;

export function FeatureGrid({ items, className = '' }: { items: Array<{ icon: LucideIcon; title: string; body: string; label?: string }>; className?: string }) {
  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {items.map(({ icon: Icon, title, body, label }, index) => (
        <Card key={title} className="surface group p-6 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between mb-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9f0f5] text-[#355a78] transition group-hover:bg-[#355a78] group-hover:text-white dark:group-hover:bg-[#355a78] dark:bg-[#2a333d]">
              <Icon size={21} />
            </span>
            <span className="text-xs font-bold text-[#bcb3a6]">0{index + 1}</span>
          </div>
          {label && <p className="eyebrow mt-6">{label}</p>}
          <h3 className="mt-2 text-xl font-bold">{title}</h3>
          <p className="muted mt-3 text-sm leading-6">{body}</p>
        </Card>
      ))}
    </div>
  );
}
