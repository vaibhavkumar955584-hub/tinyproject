export * from './env.js';
import { z } from 'zod';

export const tenderSourceSchema = z.enum(['CPPP', 'GEM']);
export const verdictSchema = z.enum(['BID', 'RISKY', 'DONT_BID']);
export const fetchStatusSchema = z.enum(['OK', 'FETCH_FAILED', 'NEEDS_MANUAL_STEP']);

export type TenderSource = z.infer<typeof tenderSourceSchema>;
export type Verdict = z.infer<typeof verdictSchema>;
export type FetchStatus = z.infer<typeof fetchStatusSchema>;
