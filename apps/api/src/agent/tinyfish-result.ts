import { z } from 'zod';

export const TenderListSchema = z.object({
  blocked: z.enum(['none', 'captcha', 'login']).default('none'),
  tenders: z.array(z.object({
    title: z.string(),
    tenderId: z.string().nullable(),
    department: z.string().nullable(),
    closingDate: z.string().nullable(),
    detailUrl: z.string().url().nullable(),
  })).max(10),
});

export const TenderDetailSchema = z.object({
  blocked: z.enum(['none', 'captcha', 'login']).default('none'),
  title: z.string().nullable(),
  closingDate: z.string().nullable(),
  emdText: z.string().nullable(),
  eligibilityText: z.string().nullable(),
  documentLinks: z.array(z.string().url()),
  pageText: z.string().nullable(),
});

export const CorrigendumSchema = z.object({
  blocked: z.enum(['none', 'captcha', 'login']).default('none'),
  closingDate: z.string().nullable(),
  emdText: z.string().nullable(),
  eligibilityText: z.string().nullable(),
  corrigenda: z.array(z.object({
    title: z.string(),
    date: z.string(),
  })),
});

export type TenderListResult = z.infer<typeof TenderListSchema>;
export type TenderDetailResult = z.infer<typeof TenderDetailSchema>;
export type CorrigendumResult = z.infer<typeof CorrigendumSchema>;

export function validateTenderList(data: unknown): TenderListResult {
  return TenderListSchema.parse(data);
}

export function validateTenderDetail(data: unknown): TenderDetailResult {
  return TenderDetailSchema.parse(data);
}

export function validateCorrigendum(data: unknown): CorrigendumResult {
  return CorrigendumSchema.parse(data);
}
