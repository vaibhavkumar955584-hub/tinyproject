export * from './env.js';
export * from './eligibility.js';
import { z } from 'zod';

export const tenderSourceSchema = z.enum(['CPPP', 'GEM', 'GEPNIC', 'IREPS', 'DEFENCE', 'PSU', 'CUSTOM']);
export const portalKindSchema = z.enum(['CPPP', 'GEM', 'GEPNIC', 'IREPS', 'DEFENCE', 'PSU', 'CUSTOM']);
export type PortalKind = z.infer<typeof portalKindSchema>;

export const queryIntentSchema = z.enum(['goods', 'services', 'works', 'unknown']);
export type QueryIntent = z.infer<typeof queryIntentSchema>;

export const queryPlanSchema = z.object({
  original: z.string(),
  normalized: z.string(),
  intent: queryIntentSchema,
  canonicalTerms: z.array(z.string()),
  synonyms: z.array(z.string()),
  hindiTerms: z.array(z.string()),
  excludeTerms: z.array(z.string()),
  categoryHints: z.array(z.string()),
  stateHints: z.array(z.string()),
  valueHint: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  portalQueries: z.record(z.string(), z.array(z.string())),
});
export type QueryPlan = z.infer<typeof queryPlanSchema>;

export const tenderCandidateSchema = z.object({
  portalId: z.string(),
  sourceTenderId: z.string(),
  title: z.string(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  closingDate: z.string().nullable().optional(),
  estimatedValueInr: z.number().nullable().optional(),
  emdInr: z.number().nullable().optional(),
  detailUrl: z.string(),
  snippet: z.string().optional(),
  discoveredVia: z.enum(['search', 'fetch', 'agent']),
  alsoOn: z.array(z.string()).default([]),
  relevance: z.number().min(0).max(100).default(50),
  whyMatched: z.string().optional(),
});
export type TenderCandidate = z.infer<typeof tenderCandidateSchema>;

export const verdictSchema = z.enum(['BID', 'RISKY', 'DONT_BID']);
export const fetchStatusSchema = z.enum(['OK', 'FETCH_FAILED', 'NEEDS_MANUAL_STEP']);
export const msmeStatusSchema = z.enum(['NONE', 'MICRO', 'SMALL', 'MEDIUM']);
export const jobStatusSchema = z.enum(['QUEUED', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED']);
export const requirementTypeSchema = z.enum(['TURNOVER', 'EXPERIENCE', 'EMD', 'DOCUMENT', 'LOCATION', 'CERTIFICATION', 'OTHER']);
export const requirementStatusSchema = z.enum(['PASS', 'FAIL', 'RISK', 'UNKNOWN']);
export const alertChangeTypeSchema = z.enum(['DEADLINE', 'EMD', 'CONDITION', 'OTHER']);
export const tenderImageSourceSchema = z.enum(['SCREENSHOT', 'ORG_BADGE', 'CATEGORY_ICON']);

export const tenderImageSchema = z.object({
  thumbUrl: z.string().nullable().optional(),
  fullUrl: z.string().nullable().optional(),
  source: tenderImageSourceSchema,
  alt: z.string(),
});

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
  query: z.string().trim().min(2).max(500),
  sources: z.array(tenderSourceSchema).optional().default(['CPPP', 'GEM']),
  portals: z.union([z.array(z.string()), z.literal('all')]).optional(),
  filters: z.object({
    state: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    closingWithinDays: z.number().optional(),
    sources: z.array(z.string()).optional(),
  }).optional(),
});
export type SearchInput = z.infer<typeof searchInputSchema>;

export const requirementSchema = z.object({
  type: requirementTypeSchema,
  valueJson: z.record(z.unknown()),
  sourceUrl: z.string().url(),
  sourceQuote: z.string().min(1),
  screenshotUrl: z.string().url().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export const tenderListSchema = z.object({
  blocked: z.enum(['none', 'captcha', 'login']).default('none'),
  tenders: z.array(z.object({
    title: z.string(),
    tenderId: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    closingDate: z.string().nullable().optional(),
    detailUrl: z.string().url().nullable().optional(),
  })).max(20),
});

export const tenderDetailSchema = z.object({
  blocked: z.enum(['none', 'captcha', 'login']).default('none'),
  title: z.string().nullable().optional(),
  closingDate: z.string().nullable().optional(),
  emdText: z.string().nullable().optional(),
  eligibilityText: z.string().nullable().optional(),
  documentLinks: z.array(z.string().url()).default([]),
  pageText: z.string().nullable().optional(),
  screenshotUrl: z.string().url().nullable().optional(),
});

export const corrigendumSchema = z.object({
  blocked: z.enum(['none', 'captcha', 'login']).default('none'),
  closingDate: z.string().nullable().optional(),
  emdText: z.string().nullable().optional(),
  eligibilityText: z.string().nullable().optional(),
  corrigenda: z.array(z.object({
    title: z.string(),
    date: z.string(),
  })).default([]),
});

export const agentEfficiencySchema = z.object({
  tendersCount: z.number().int().nonnegative().default(0),
  agentRuns: z.number().int().nonnegative().default(0),
  fetchCalls: z.number().int().nonnegative().default(0),
  searchCalls: z.number().int().nonnegative().default(0),
  cachedHits: z.number().int().nonnegative().default(0),
  stepsUsed: z.number().int().nonnegative().default(0),
});

export type TenderListResult = z.infer<typeof tenderListSchema>;
export type TenderDetailResult = z.infer<typeof tenderDetailSchema>;
export type CorrigendumResult = z.infer<typeof corrigendumSchema>;
export type AgentEfficiency = z.infer<typeof agentEfficiencySchema>;

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
export type TenderImageSource = z.infer<typeof tenderImageSourceSchema>;
export type TenderImage = z.infer<typeof tenderImageSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type RequirementType = z.infer<typeof requirementTypeSchema>;
export type RequirementStatus = z.infer<typeof requirementStatusSchema>;
export type VerdictReason = z.infer<typeof verdictReasonSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;
