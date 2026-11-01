'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e6e1d8] bg-[#fffefa] text-[#355a78] transition-colors hover:bg-[#f3f0e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7397b2] dark:border-[#3a342e] dark:bg-[#24201c] dark:text-[#8fb3c9] dark:hover:bg-[#2d2924] ${className}`}
    >
      {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}
