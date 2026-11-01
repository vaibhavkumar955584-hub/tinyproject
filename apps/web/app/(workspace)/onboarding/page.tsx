'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { profileInputSchema } from '@tenderguard/shared';
import type { ProfileInput } from '@tenderguard/shared';
import type { z } from 'zod';
import { Card, PageTitle } from '../../../components/ui';
import { api } from '../../../lib/api';

const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
const commonDocuments = ['PAN', 'GST Registration', 'Udyam Registration', 'Audited financial statements', 'Income tax returns', 'Work completion certificates', 'EPF Registration', 'ESI Registration'];
const commonCertifications = ['ISO 9001', 'ISO 27001', 'ISO 14001', 'CMMI', 'Startup India'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: () => api<ProfileInput>('/profile'), retry: false });
  const form = useForm<z.input<typeof profileInputSchema>, unknown, ProfileInput>({ resolver: zodResolver(profileInputSchema), defaultValues: { category: '', state: '', annualTurnoverInr: 0, experienceYears: 0, msmeStatus: 'NONE', certifications: [], documentsHeld: [] } });
  const [customCertification, setCustomCertification] = useState('');
  const [customDocument, setCustomDocument] = useState('');
  const certifications = form.watch('certifications') ?? [];
  const documentsHeld = form.watch('documentsHeld') ?? [];
  const values = form.watch();
  const strength = useMemo(() => {
    const checks = [Boolean(values.category), Boolean(values.state), Number(values.annualTurnoverInr) > 0, Number(values.experienceYears) > 0, values.msmeStatus !== 'NONE', certifications.length > 0, documentsHeld.length > 0];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }, [values.category, values.state, values.annualTurnoverInr, values.experienceYears, values.msmeStatus, certifications.length, documentsHeld.length]);
  const save = useMutation({ mutationFn: (data: ProfileInput) => api('/profile', { method: 'PUT', body: JSON.stringify(data) }), onSuccess: () => router.push('/search') });

  useEffect(() => { if (profileQuery.data) form.reset({ ...profileQuery.data, annualTurnoverInr: Number(profileQuery.data.annualTurnoverInr) }); }, [profileQuery.data, form]);

  const toggleArray = (key: 'certifications' | 'documentsHeld', value: string) => {
    const current = form.getValues(key) ?? [];
    form.setValue(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value], { shouldDirty: true });
  };

  const submit = form.handleSubmit((data) => save.mutate(data));
  const nextStep = async () => {
    const isValid = await form.trigger(['category', 'state', 'annualTurnoverInr', 'experienceYears', 'msmeStatus']);
    if (isValid) setStep(2);
  };

  return <>
    <PageTitle eyebrow="One-time setup" title="Tell us about your business" description="Your profile is the baseline for each eligibility check. Keep it current so the verdicts reflect what your business can prove." action={<span className="badge badge-blue"><ShieldCheck size={13} />Private to your account</span>} />
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
      <Card className="p-5 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          {[1, 2].map((number) => (
            <div key={number} className="flex flex-1 items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${step >= number ? 'bg-[#694d38] text-white' : 'bg-[#eeeae2] text-[#8b8479] dark:text-[#756D63]'}`}>
                {step > number ? <Check size={15} /> : number}
              </span>
              <span className={`text-xs font-bold ${step === number ? 'text-[#4d382a]' : 'muted'}`}>
                {number === 1 ? 'Business details' : 'Readiness documents'}
              </span>
              {number === 1 && <span className="h-px flex-1 bg-[#e6e1d8] dark:bg-[#38312A]" />}
            </div>
          ))}
        </div>
        <form onSubmit={submit}>
          {step === 1 ? <div className="space-y-5 animate-in">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-2 block text-xs font-bold" htmlFor="category">Business category</label><input id="category" className="field" placeholder="e.g. IT services, civil works, office supplies" {...form.register('category')} /><FieldError message={form.formState.errors.category?.message} /></div>
              <div><label className="mb-2 block text-xs font-bold" htmlFor="state">Registered state</label><select id="state" className="field" {...form.register('state')}><option value="">Choose a state</option>{states.map((state) => <option key={state}>{state}</option>)}</select><FieldError message={form.formState.errors.state?.message} /></div>
              <div><label className="mb-2 block text-xs font-bold" htmlFor="turnover">Annual turnover</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#777168]">₹</span><input id="turnover" type="number" min="0" step="1000" className="field pl-8" placeholder="30,00,000" {...form.register('annualTurnoverInr', { valueAsNumber: true })} /></div><FieldError message={form.formState.errors.annualTurnoverInr?.message as string | undefined} /><p className="muted mt-1 text-[10px]">Average annual turnover in INR, not total contract value.</p></div>
              <div><label className="mb-2 block text-xs font-bold" htmlFor="experience">Relevant experience</label><div className="relative"><input id="experience" type="number" min="0" max="100" className="field pr-16" {...form.register('experienceYears', { valueAsNumber: true })} /><span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#777168]">years</span></div><FieldError message={form.formState.errors.experienceYears?.message as string | undefined} /></div>
              <div><label className="mb-2 block text-xs font-bold" htmlFor="msme">MSME status</label><select id="msme" className="field" {...form.register('msmeStatus')}><option value="NONE">Not registered / not applicable</option><option value="MICRO">Micro enterprise</option><option value="SMALL">Small enterprise</option><option value="MEDIUM">Medium enterprise</option></select><p className="muted mt-1 text-[10px]">TenderGuard only applies a relaxation if the tender explicitly states it.</p></div>
            </div>
            <div className="flex justify-end border-t border-[#e6e1d8] pt-5"><button type="button" onClick={() => void nextStep()} className="btn-primary">Continue <ArrowRight size={16} /></button></div>
          </div> : <div className="space-y-6 animate-in">
            <fieldset><legend className="mb-3 flex items-center gap-2 text-sm font-bold"><FileText size={17} className="text-[#355a78]" />Documents you already hold</legend><p className="muted mb-3 text-xs leading-5">We compare required documents against this list and add missing items to your checklist.</p><div className="grid gap-2 sm:grid-cols-2">{commonDocuments.map((doc) => <Choice key={doc} label={doc} checked={documentsHeld.includes(doc)} onChange={() => toggleArray('documentsHeld', doc)} />)}</div><div className="mt-3 flex gap-2"><input value={customDocument} onChange={(event) => setCustomDocument(event.target.value)} className="field py-2.5 text-sm" placeholder="Add another document" /><button type="button" className="btn-secondary shrink-0 py-2" onClick={() => { const value = customDocument.trim(); if (value) toggleArray('documentsHeld', value); setCustomDocument(''); }}>Add</button></div></fieldset>
            <fieldset><legend className="mb-3 flex items-center gap-2 text-sm font-bold"><BadgeCheck size={17} className="text-[#355a78]" />Certifications</legend><div className="grid gap-2 sm:grid-cols-2">{commonCertifications.map((cert) => <Choice key={cert} label={cert} checked={certifications.includes(cert)} onChange={() => toggleArray('certifications', cert)} />)}</div><div className="mt-3 flex gap-2"><input value={customCertification} onChange={(event) => setCustomCertification(event.target.value)} className="field py-2.5 text-sm" placeholder="Add another certification" /><button type="button" className="btn-secondary shrink-0 py-2" onClick={() => { const value = customCertification.trim(); if (value) toggleArray('certifications', value); setCustomCertification(''); }}>Add</button></div></fieldset>
            {save.isError && <p role="alert" className="rounded-xl bg-[#f8eae7] p-3 text-sm text-[#a93b34] dark:text-[#DE8F87]">{save.error.message}</p>}
            <div className="flex flex-wrap justify-between gap-3 border-t border-[#e6e1d8] pt-5"><button type="button" onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={15} />Back</button><button disabled={save.isPending} className="btn-primary">{save.isPending ? 'Saving…' : 'Save profile and start'} <ArrowRight size={16} /></button></div>
          </div>}
        </form>
      </Card>
      <aside className="space-y-4">
        <Card className="bg-[#355a78] p-5 text-white dark:bg-[#242E38]"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[.14em] text-[#c4d4de] dark:text-[#9FC9C9]">Profile strength</span><Sparkles size={17} /></div><div className="mt-4 flex items-end gap-2"><span className="text-4xl font-bold">{strength}%</span><span className="mb-1 text-xs text-[#d3e0e7] dark:text-[#8FB3C9]">complete</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20 dark:bg-[#302A24]"><div className="h-full rounded-full bg-[#b9d6c0] transition-all" style={{ width: `${strength}%` }} /></div><p className="mt-4 text-xs leading-5 text-[#e2ebef] dark:text-[#BDD0DF]">More detail helps TenderGuard explain which tender clauses match your evidence and what’s missing.</p></Card>
        <Card className="p-5"><p className="eyebrow">How we use this</p><ul className="mt-4 space-y-3 text-xs leading-5 text-[#69645c]"><li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#3f7458]" size={15} />Compare explicit tender thresholds against your profile.</li><li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#3f7458]" size={15} />Highlight documents and conditions to verify.</li><li className="flex gap-2"><Check className="mt-0.5 shrink-0 text-[#3f7458]" size={15} />Never treat MSME relaxations as automatic.</li></ul></Card>
        <p className="muted px-1 text-[10px] leading-4">TenderGuard doesn’t store passwords for procurement portals and never submits a bid on your behalf.</p>
      </aside>
    </div>
  </>;
}

function Choice({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${checked ? 'border-[#a9c5b1] bg-[#e9f2ec] text-[#3f7458] dark:border-[#2D543D]' : 'border-[#e6e1d8] bg-[#fffefa] text-[#69645c] hover:bg-[#f7f5ef]'}`}><input type="checkbox" checked={checked} onChange={onChange} className="accent-[#3f7458]" />{label}</label>;
}

function FieldError({ message }: { message?: string | undefined }) { return message ? <p className="mt-1 text-xs text-[#b9473f]">{message}</p> : null; }
