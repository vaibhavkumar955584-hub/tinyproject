'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { loginInputSchema, registerInputSchema } from '@tenderguard/shared';
import type { z } from 'zod';
import { api } from '../lib/api';
import { BrandLogo } from './brand-logo';

type AuthValues = z.infer<typeof loginInputSchema>;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<AuthValues>({ resolver: zodResolver(isRegister ? registerInputSchema : loginInputSchema), defaultValues: { email: '', password: '' } });
  const mutation = useMutation({
    mutationFn: (values: AuthValues) => api<{ user: { id: string; email: string } }>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['me'] }); router.push(isRegister ? '/onboarding' : '/search'); },
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(400px,.9fr)_1.1fr]">
      <section className="flex min-h-screen flex-col justify-between bg-[#4d382a] px-6 py-7 text-[#fffefa] sm:px-12 lg:px-16">
        <Link href="/" aria-label="TenderGuard home" className="inline-flex w-fit items-center rounded-2xl bg-[#fffefa] p-2.5 shadow-sm"><BrandLogo className="h-auto w-[210px]" priority /></Link>
        <div className="my-12 max-w-xl animate-in"><span className="rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#e5d6c3]">For Indian MSMEs</span><h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">Bid with your eyes open.</h1><p className="mt-5 max-w-md text-sm leading-7 text-[#e4d9ca]">See the exact eligibility clauses, spot the risks in your profile, and prepare your documents before you commit to a tender.</p><div className="mt-8 space-y-3 text-sm text-[#efe5d8]"><p className="flex items-center gap-3"><span className="text-[#9fc9a7]">✓</span> Clear BID / RISKY / DON’T BID decisions</p><p className="flex items-center gap-3"><span className="text-[#9fc9a7]">✓</span> Every requirement linked to source evidence</p><p className="flex items-center gap-3"><span className="text-[#9fc9a7]">✓</span> Corrigendum monitoring and change alerts</p></div></div>
        <p className="text-[10px] text-[#cbbba7]">Decision support, not legal advice. Verify against the official tender document.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px] animate-in">
          <p className="eyebrow">{isRegister ? 'Create your workspace' : 'Welcome back'}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{isRegister ? 'Start with your business' : 'Sign in to TenderGuard'}</h2>
          <p className="muted mt-2 text-sm">{isRegister ? 'Your profile stays private to your account.' : 'Pick up where your procurement work left off.'}</p>
          <form className="mt-8 space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div><label htmlFor="email" className="mb-2 block text-xs font-bold">Work email</label><input id="email" type="email" autoComplete="email" className="field" placeholder="you@business.in" {...form.register('email')} />{form.formState.errors.email && <p className="mt-1 text-xs text-[#b9473f]">{form.formState.errors.email.message}</p>}</div>
            <div><label htmlFor="password" className="mb-2 block text-xs font-bold">Password</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} className="field pr-12" placeholder={isRegister ? 'At least 10 characters' : 'Your password'} {...form.register('password')} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777168]">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{form.formState.errors.password && <p className="mt-1 text-xs text-[#b9473f]">{form.formState.errors.password.message}</p>}</div>
            {mutation.isError && <p role="alert" className="rounded-xl bg-[#f8eae7] px-3 py-2 text-sm text-[#a93b34]">{mutation.error.message}</p>}
            <button className="btn-primary w-full py-3.5" disabled={mutation.isPending}>{mutation.isPending ? 'Working…' : isRegister ? 'Create account' : 'Sign in'}{!mutation.isPending && <ArrowRight size={16} />}</button>
          </form>
          <p className="muted mt-6 text-center text-sm">{isRegister ? 'Already have an account?' : 'New to TenderGuard?'} <Link className="font-bold text-[#355a78] underline decoration-[#b9c8d2] underline-offset-4" href={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create account'}</Link></p>
          <div className="mt-7 rounded-xl border border-[#e6e1d8] bg-[#fffefa] p-3 text-[11px] leading-5 text-[#777168]"><strong className="text-[#4d382a]">Demo access</strong><br />When the local database is seeded, use <code>demo@tenderguard.local</code> and <code>TenderGuardDemo123!</code>.</div>
        </div>
      </section>
    </div>
  );
}
