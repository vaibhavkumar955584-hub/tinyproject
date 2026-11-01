'use client';

import { type ReactNode } from 'react';

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-busy="true" aria-label="Loading" />;
}

export function SkeletonCircle({ className = '', size = 48 }: { className?: string; size?: number }) {
  return <Skeleton className={className} style={{ width: size, height: size, borderRadius: '50%' }} />;
}

export function SkeletonLine({ className = '', width = '60%', height = 14 }: { className?: string; width?: string | number; height?: number }) {
  return <Skeleton className={className} style={{ width, height, borderRadius: height / 2 }} />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '40%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCard({ children }: { children: ReactNode }) {
  return (
    <div className="surface p-5 sm:p-6 animate-in">
      <div className="grid gap-4">
        <div className="flex items-start gap-4">
          <SkeletonCircle size={48} />
          <div className="min-w-0 flex-1 space-y-3">
            <SkeletonLine width="60%" />
            <SkeletonLine width="100%" />
          </div>
        </div>
        <SkeletonText lines={2} />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLine key={i} width={i < 2 ? '100%' : '70%'} />
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface overflow-x-auto p-0">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <thead className="bg-[#f7f5ef] text-[10px] font-extrabold uppercase tracking-wide text-[#817b72] dark:bg-[#2d2924]">
          <tr>
            {Array.from({ length: 5 }).map((_, i) => (
              <th key={i} className="px-5 py-3 skeleton" style={{ width: i === 4 ? '140px' : 'auto' }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t border-[#eee9e1] align-top dark:border-[#3a342e]">
              {Array.from({ length: 5 }).map((_, c) => (
                <td key={c} className="px-5 py-4 skeleton" style={{ height: 24, width: c === 4 ? '140px' : 'auto' }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonList({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="surface p-4">
          <div className="flex gap-4">
            <SkeletonCircle size={40} />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine width="70%" />
              <SkeletonLine width="100%" />
              <SkeletonLine width="55%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBadge({ className = '' }: { className?: string }) {
  return <span className={`badge ${className} skeleton`} style={{ width: 60, height: 20, display: 'inline-flex' }} />;
}

export function SkeletonButton({ className = '' }: { className?: string }) {
  return <button className={`btn-primary ${className} skeleton`} style={{ width: 140, height: 42, pointerEvents: 'none' }} disabled />;
}
