'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface ToastItem { id: string; type: ToastType; title: string; message?: string | undefined; duration: number }
type ToastInput = { type?: ToastType; title: string; message?: string; duration?: number };
type ToastContextValue = { toasts: ToastItem[]; toast: (input: ToastInput) => string; dismiss: (id: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;
const typeConfig: Record<ToastType, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-soft)', border: 'var(--green-border)' },
  error: { icon: AlertCircle, color: 'var(--red)', bg: 'var(--red-soft)', border: 'var(--red-border)' },
  warning: { icon: AlertTriangle, color: 'var(--amber)', bg: 'var(--amber-soft)', border: 'var(--amber-border)' },
  info: { icon: Info, color: 'var(--blue)', bg: 'var(--blue-soft)', border: 'var(--blue-border)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', title, message, duration = TOAST_REMOVE_DELAY }: ToastInput) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((previous) => [...previous, { id, type, title, message, duration }].slice(-TOAST_LIMIT));
    timers.current.set(id, setTimeout(() => dismiss(id), duration));
    return id;
  }, [dismiss]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return <ToastContext.Provider value={{ toasts, toast, dismiss }}>{children}<ToastContainer toasts={toasts} onDismiss={dismiss} /></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const config = typeConfig[toast.type];
  const Icon = config.icon;
  return (
    <div className="surface flex items-start gap-3 border-l-4 border-l-[#694d38] p-4 shadow-xl animate-in dark:border-l-[#b19e84] sm:p-5" role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border" style={{ color: config.color, backgroundColor: config.bg, borderColor: config.border }}>
        <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 leading-6">
        <p className="text-sm font-bold">{toast.title}</p>
        {toast.message && <p className="muted mt-1 text-xs leading-5">{toast.message}</p>}
      </div>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification" className="ml-2 shrink-0 rounded-full p-1.5 text-[#777168] transition-colors hover:bg-white/60 focus-visible:outline focus-visible:outline-2">
        <X size={14} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:top-5" aria-label="Notifications">
      {toasts.map((item) => <div key={item.id} className="pointer-events-auto w-full max-w-sm"><Toast toast={item} onDismiss={onDismiss} /></div>)}
    </div>
  );
}
