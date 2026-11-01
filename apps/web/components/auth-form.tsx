'use client';

import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bot, Building2, CheckCircle2, ShieldCheck, Sparkles, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../lib/api';
import { BrandLogo } from './brand-logo';
import { ThemeToggle } from './theme-toggle';
import { setDemoSessionActive } from '../lib/store';

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
        body: JSON.stringify({ code, csrfToken }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/overview');
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
    <div className="mt-4">
      <button
        type="button"
        onClick={() => signInWithGoogle()}
        disabled={mutation.isPending}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] px-4 text-xs font-bold text-[#2E2118] shadow-sm transition hover:bg-[#FAF7F2] dark:border-[#38312A] dark:bg-[#28231E] dark:text-[#F2EBE1]"
      >
        <GoogleMark />
        {mutation.isPending ? 'Verifying Google account…' : mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
      </button>
      {message && <p role="alert" className="mt-3 rounded-lg bg-[#FAEDE9] p-2.5 text-xs text-[#A83832] dark:bg-[#382421] dark:text-[#DE8F87]">{message}</p>}
    </div>
  );
}

function EmailPasswordAuth({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(undefined);
    setError(undefined);
    setPending(true);
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      await api<AuthResponse>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/overview');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6259]" />
          <input
            id="email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] pl-9 pr-3 text-xs text-[#2E2118] placeholder:text-[#A3998C] focus:outline-none focus:ring-1 focus:ring-[#6B4226] dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1] dark:placeholder:text-[#9E958A]"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6259]" />
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-10 rounded-xl border border-[#E8DED2] bg-[#FFFFFF] pl-9 pr-3 text-xs text-[#2E2118] placeholder:text-[#A3998C] focus:outline-none focus:ring-1 focus:ring-[#6B4226] dark:border-[#38312A] dark:bg-[#221D19] dark:text-[#F2EBE1] dark:placeholder:text-[#9E958A]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-transparent bg-[#6B4226] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#52311A] dark:hover:bg-[#B8977E] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
      </button>
      {error && <p role="alert" className="mt-1 rounded-lg bg-[#FAEDE9] p-2.5 text-xs text-[#A83832] dark:bg-[#382421] dark:text-[#DE8F87]">{error}</p>}
      {message && <p className="mt-1 rounded-lg bg-[#EBF4EF] p-2.5 text-xs text-[#2F6B4F] dark:bg-[#202E26] dark:text-[#7BB896]">{message}</p>}
    </form>
  );
}

function GoogleAuthContent({ mode }: { mode: AuthMode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return (
      <div className="mt-4 rounded-xl border border-[#E8DED2] bg-[#FAF7F2] p-3 text-center text-xs text-[#6B6259] dark:border-[#38312A] dark:bg-[#1A1613] dark:text-[#9E958A]">
        Google sign-in is optional. Click <b>Continue as Demo MSME</b> below for instant full-feature access.
      </div>
    );
  }
  return <GoogleOAuthProvider clientId={clientId}><GoogleAuth mode={mode} /></GoogleOAuthProvider>;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === 'register';
  const router = useRouter();

  const enterDemoMode = () => {
    setDemoSessionActive(true);
    router.push('/overview');
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(420px,.9fr)_1.1fr] bg-[#FAF7F2] dark:bg-[#1A1613]">
      {/* Left Brand Panel */}
      <section className="flex min-h-screen flex-col justify-between bg-[#6B4226] px-6 py-8 text-[#FFFFFF] sm:px-12 lg:px-16 dark:bg-[#28231E]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="TenderGuard home" className="inline-flex w-fit items-center rounded-2xl bg-white p-2.5 shadow-sm">
            <BrandLogo className="h-auto w-[200px]" priority />
          </Link>
          <ThemeToggle className="border-white/20 bg-white/10 text-white hover:bg-white/20" />
        </div>

        <div className="my-10 max-w-lg">
          <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#E5D6C3]">
            Tender Intelligence for Indian MSMEs
          </span>
          <h1 className="mt-6 text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl text-white">
            Bid with your eyes wide open.
          </h1>
          <p className="mt-4 text-xs leading-relaxed text-[#E4D9CA]">
            Identify disqualification risks before spending weeks on paperwork. TinyFish autonomous agents screen CPPP and GeM notices and verify every requirement against your profile.
          </p>

          <div className="mt-8 space-y-3 text-xs text-[#EFE5D8]">
            <p className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#9FC9A7] shrink-0" />
              <span>Verbatim clause proof behind every requirement</span>
            </p>
            <p className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#9FC9A7] shrink-0" />
              <span>Deterministic MSME turnover relaxation engine</span>
            </p>
            <p className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#9FC9A7] shrink-0" />
              <span>Corrigendum radar with before/after diff alerts</span>
            </p>
          </div>
        </div>

        <p className="text-[10px] text-[#CBBBA7]">
          Decision support, not legal advice. Verify against the official tender document.
        </p>
      </section>

      {/* Right Login / Register Panel */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12 dark:bg-[#1A1613]">
        <div className="w-full max-w-[420px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B4226] dark:text-[#B8977E]">
            {isRegister ? 'New Workspace' : 'Welcome Back'}
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#2E2118] dark:text-[#F2EBE1]">
            {isRegister ? 'Start with TenderGuard' : 'Sign in to TenderGuard'}
          </h2>
          <p className="mt-1 text-xs text-[#6B6259] dark:text-[#9E958A]">
            Access your government tender intelligence workspace.
          </p>

          {/* Email/Password Form */}
          <EmailPasswordAuth mode={mode} />

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#E8DED2] dark:bg-[#38312A]" />
            <span className="text-[10px] uppercase font-bold text-[#8C8276]">Or with Google</span>
            <span className="h-px flex-1 bg-[#E8DED2] dark:bg-[#38312A]" />
          </div>

          <GoogleAuthContent mode={mode} />

          <p className="mt-6 text-center text-xs text-[#6B6259] dark:text-[#9E958A]">
            {isRegister ? 'Already have an account?' : 'New to TenderGuard?'}{' '}
            <Link
              href={isRegister ? '/login' : '/register'}
              className="font-bold text-[#6B4226] underline decoration-[#E8DED2] underline-offset-4 hover:text-[#52311A] dark:text-[#B8977E]"
            >
              {isRegister ? 'Sign in' : 'Create workspace'}
            </Link>
          </p>

          {/* Quick Demo Access Button */}
          <div className="mt-6 rounded-2xl border-2 border-[#6B4226] bg-[#FFFFFF] p-4 shadow-sm dark:border-[#8B5E3C] dark:bg-[#221D19]">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[#6B4226] dark:text-[#CCAFA0]">
              <Sparkles size={15} />
              <span>Instant Hackathon / Evaluator Demo Access</span>
            </div>
            <p className="text-[11px] text-[#6B6259] dark:text-[#9E958A] leading-relaxed mb-3">
              Explore the complete platform loaded with verified CPPP & GeM tenders, MSME profile, and live agent telemetry.
            </p>
            <button
              type="button"
              onClick={enterDemoMode}
              className="btn-primary w-full py-2.5 text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 size={15} />
              <span>Continue as Demo MSME Workspace</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
