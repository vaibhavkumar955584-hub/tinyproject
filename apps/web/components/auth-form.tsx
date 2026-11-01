'use client';

import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../lib/api';
import { BrandLogo } from './brand-logo';
import { ThemeToggle } from './theme-toggle';

type AuthResponse = { user: { id: string; email: string } };
type AuthMode = 'login' | 'register';

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.8 6-14.9Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.7-3.5-11.3-8.2H5.8v5.2A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.7 27.9a12 12 0 0 1 0-7.8v-5.2H5.8a20 20 0 0 0 0 18.2l6.9-5.2Z" />
      <path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9A19.7 19.7 0 0 0 24 4 20 20 0 0 0 5.8 14.9l6.9 5.2c1.6-4.7 6.1-8.2 11.3-8.2Z" />
    </svg>
  );
}

function GoogleAuth({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const mutation = useMutation({
    mutationFn: async (code: string) => {
      const { csrfToken } = await api<{ csrfToken: string }>('/auth/google/csrf');
      return api<AuthResponse>('/auth/google', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XmlHttpRequest' },
        body: JSON.stringify({ code, csrfToken }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push(mode === 'register' ? '/onboarding' : '/search');
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const signInWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',
    onSuccess: (response) => {
      setMessage(undefined);
      if (!response.code) {
        setMessage('Google did not return an authorization code. Please try again.');
        return;
      }
      mutation.mutate(response.code);
    },
    onError: () => setMessage('Google sign-in was cancelled or could not start. Please try again.'),
    onNonOAuthError: () => setMessage('The Google sign-in window could not open. Allow popups and try again.'),
  });

  return (
    <div className="mt-8">
      <button type="button" onClick={() => signInWithGoogle()} disabled={mutation.isPending} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#d7d0c6] bg-[#fffefa] px-4 text-sm font-bold text-[#32281f] shadow-sm transition-colors hover:bg-[#f5f1e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355a78] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:border-[#51483e] dark:bg-[#2d2924] dark:text-[#f5efe4] dark:hover:bg-[#39332c]">
        <GoogleMark />
        {mutation.isPending ? 'Verifying Google account…' : mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
      </button>
      {message && <p role="alert" className="mt-4 rounded-xl bg-[#f8eae7] px-3 py-2 text-sm text-[#a93b34] dark:bg-[#3d2622] dark:text-[#e2a8a0]">{message}</p>}
      <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#dce7df] bg-[#f1f6f2] p-3 text-[11px] leading-5 text-[#52715a] dark:border-[#35463b] dark:bg-[#26332b] dark:text-[#a8c5ac]">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <p>Secure sign-in with Google. TenderGuard never sees or stores your Google password.</p>
      </div>
    </div>
  );
}

function GoogleAuthContent({ mode }: { mode: AuthMode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return <p role="status" className="mt-8 rounded-xl border border-[#e6e1d8] bg-[#fffefa] px-4 py-3 text-center text-xs leading-5 text-[#777168] dark:border-[#3a342e] dark:bg-[#2d2924] dark:text-[#a49d92]">Google sign-in needs <code className="font-bold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> configured for the web app.</p>;
  }
  return <GoogleOAuthProvider clientId={clientId}><GoogleAuth mode={mode} /></GoogleOAuthProvider>;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === 'register';
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(400px,.9fr)_1.1fr]">
      <section className="flex min-h-screen flex-col justify-between bg-[#4d382a] px-6 py-7 text-[#fffefa] sm:px-12 lg:px-16 dark:bg-[#2d2924]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="TenderGuard home" className="inline-flex w-fit items-center rounded-2xl bg-[#fffefa] p-2.5 shadow-sm"><BrandLogo className="h-auto w-[210px]" priority /></Link>
          <ThemeToggle className="border-white/20 bg-white/10 text-white hover:bg-white/20 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" />
        </div>
        <div className="my-12 max-w-xl animate-in"><span className="rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#e5d6c3] dark:text-[#cbbba7] dark:border-[#3a342e]">For Indian MSMEs</span><h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">Bid with your eyes open.</h1><p className="mt-5 max-w-md text-sm leading-7 text-[#e4d9ca] dark:text-[#d3d0ca]">See the exact eligibility clauses, spot the risks in your profile, and prepare your documents before you commit to a tender.</p><div className="mt-8 space-y-3 text-sm text-[#efe5d8] dark:text-[#d3d0ca]"><p className="flex items-center gap-3"><span className="text-[#9fc9a7]">✓</span> Clear BID / RISKY / DON'T BID decisions</p><p className="flex items-center gap-3"><span className="text-[#9fc9a7]">✓</span> Every requirement linked to source evidence</p><p className="flex items-center gap-3"><span className="text-[#9fc9a7]">✓</span> Corrigendum monitoring and change alerts</p></div></div>
        <p className="text-[10px] text-[#cbbba7] dark:text-[#a49d92]">Decision support, not legal advice. Verify against the official tender document.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 dark:bg-[#24201c]">
        <div className="w-full max-w-[420px] animate-in">
          <p className="eyebrow">{isRegister ? 'Create your workspace' : 'Welcome back'}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{isRegister ? 'Start with Google' : 'Sign in to TenderGuard'}</h2>
          <p className="muted mt-2 text-sm">{isRegister ? 'Use your Google account to set up your business workspace.' : 'Continue securely with the Google account linked to your workspace.'}</p>
          <GoogleAuthContent mode={mode} />
          <p className="muted mt-6 text-center text-sm">{isRegister ? 'Already have a workspace?' : 'New to TenderGuard?'} <Link className="font-bold text-[#355a78] underline decoration-[#b9c8d2] underline-offset-4 dark:text-[#8fb3c9] dark:decoration-[#4a5a68]" href={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create account'}</Link></p>
          <p className="muted mt-8 flex items-center justify-center gap-2 text-center text-[11px]"><ArrowRight size={13} /> One Google account for sign-in and sign-up</p>
        </div>
      </section>
    </div>
  );
}
