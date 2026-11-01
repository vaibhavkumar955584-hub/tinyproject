export * from './env.js';
export * from './eligibility.js';
import { z } from 'zod';

export const tenderSourceSchema = z.enum(['CPPP', 'GEM']);
export const verdictSchema = z.enum(['BID', 'RISKY', 'DONT_BID']);
export const fetchStatusSchema = z.enum(['OK', 'FETCH_FAILED', 'NEEDS_MANUAL_STEP']);
export const msmeStatusSchema = z.enum(['NONE', 'MICRO', 'SMALL', 'MEDIUM']);
export const jobStatusSchema = z.enum(['QUEUED', 'RUNNING', 'DONE', 'FAILED']);
export const requirementTypeSchema = z.enum(['TURNOVER', 'EXPERIENCE', 'EMD', 'DOCUMENT', 'LOCATION', 'CERTIFICATION', 'OTHER']);
export const requirementStatusSchema = z.enum(['PASS', 'FAIL', 'RISK', 'UNKNOWN']);
export const alertChangeTypeSchema = z.enum(['DEADLINE', 'EMD', 'CONDITION', 'OTHER']);

export const profileInputSchema = z.object({
  category: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(100),
  annualTurnoverInr: z.coerce.number().int().nonnegative(),
  experienceYears: z.coerce.number().int().min(0).max(100),
  msmeStatus: msmeStatusSchema,
  certifications: z.array(z.string().trim().min(1).max(120)).default([]),
  documentsHeld: z.array(z.string().trim().min(1).max(120)).default([]),
});

export const registerInputSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});

export const loginInputSchema = registerInputSchema;

export const searchInputSchema = z.object({
  query: z.string().trim().min(3).max(500),
  sources: z.array(tenderSourceSchema).min(1).default(['CPPP', 'GEM']),
});

export const requirementSchema = z.object({
  type: requirementTypeSchema,
  valueJson: z.record(z.unknown()),
  sourceUrl: z.string().url(),
  sourceQuote: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const extractedTenderSchema = z.object({
  title: z.string().min(1),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  estimatedValueInr: z.number().int().nonnegative().nullable().optional(),
  emdInr: z.number().int().nonnegative().nullable().optional(),
  closingAt: z.string().datetime().nullable().optional(),
  requirements: z.array(z.object({
    type: requirementTypeSchema,
    valueJson: z.record(z.unknown()),
    sourceQuote: z.string().min(1),
  })),
});

export const verdictReasonSchema = z.object({
  requirementId: z.string().nullable(),
  status: requirementStatusSchema,
  explanation: z.string(),
  profileValue: z.unknown().optional(),
  tenderValue: z.unknown().optional(),
  sourceQuote: z.string().optional(),
});

export const checklistItemSchema = z.object({
  item: z.string(),
  done: z.boolean(),
  why: z.string(),
  quote: z.string().optional(),
});

export type TenderSource = z.infer<typeof tenderSourceSchema>;
export type Verdict = z.infer<typeof verdictSchema>;
export type FetchStatus = z.infer<typeof fetchStatusSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type RequirementType = z.infer<typeof requirementTypeSchema>;
export type RequirementStatus = z.infer<typeof requirementStatusSchema>;
export type VerdictReason = z.infer<typeof verdictReasonSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
