import { describe, expect, it } from 'vitest';
import type { ProfileInput } from './index.js';
import { evaluateEligibility, normalizeEvidence, validateEvidenceQuotes } from './eligibility.js';

const profile: ProfileInput = {
  category: 'IT Services',
  state: 'Uttar Pradesh',
  annualTurnoverInr: 3_000_000,
  experienceYears: 2,
  msmeStatus: 'SMALL',
  certifications: [],
  documentsHeld: ['PAN', 'GST Registration'],
};

const url = 'https://example.com/tender';

function requirement(type: 'TURNOVER' | 'EXPERIENCE' | 'EMD' | 'DOCUMENT' | 'LOCATION' | 'CERTIFICATION' | 'OTHER', valueJson: Record<string, unknown>, sourceQuote: string) {
  return { type, valueJson, sourceUrl: url, sourceQuote, confidence: 0.95 };
}

describe('tender evidence validation', () => {
  it('matches exact tender clauses while ignoring case, punctuation, and whitespace', () => {
    const evidence = 'Average annual turnover of at least Rs. 15 lakh during the last three financial years.';
    const result = validateEvidenceQuotes(`HEADER ${evidence} FOOTER`, [
      { sourceQuote: 'average annual turnover of at least RS 15 lakh during the last three financial years' },
      { sourceQuote: 'The buyer accepts any bidder turnover.' },
    ]);
    expect(result.valid).toHaveLength(1);
    expect(result.dropped).toHaveLength(1);
  });

  it('returns DONT_BID for hard turnover, experience, or location failures', () => {
    const tenderText = 'At least Rs. 1 crore turnover and 5 years experience. Registered office in Gujarat.';
    const result = evaluateEligibility(profile, [
      requirement('TURNOVER', { minimumInr: 10_000_000 }, 'At least Rs. 1 crore turnover'),
      requirement('EXPERIENCE', { minimumYears: 5 }, '5 years experience'),
      requirement('LOCATION', { state: 'Gujarat' }, 'Registered office in Gujarat'),
    ], tenderText);
    expect(result.verdict).toBe('DONT_BID');
    expect(result.score).toBeLessThanOrEqual(0);
  });

  it('returns BID when verified requirements are met with adequate margin', () => {
    const text = 'Turnover at least Rs. 15 lakh. At least 1 year of experience. PAN and GST Registration.';
    const result = evaluateEligibility(profile, [
      requirement('TURNOVER', { minimumInr: 1_500_000 }, 'Turnover at least Rs. 15 lakh'),
      requirement('EXPERIENCE', { minimumYears: 1 }, 'At least 1 year of experience'),
      requirement('DOCUMENT', { name: 'PAN' }, 'PAN and GST Registration'),
      requirement('DOCUMENT', { name: 'GST Registration' }, 'PAN and GST Registration'),
    ], text);
    expect(result.verdict).toBe('BID');
    expect(result.score).toBe(100);
  });

  it('returns RISKY for narrow turnover margin, missing documents, short deadline, and unknown evidence', () => {
    const text = 'Turnover at least Rs. 28 lakh. Submit ISO 9001 certificate.';
    const result = evaluateEligibility(profile, [
      requirement('TURNOVER', { minimumInr: 2_800_000 }, 'Turnover at least Rs. 28 lakh'),
      requirement('DOCUMENT', { name: 'ISO 9001' }, 'Submit ISO 9001 certificate'),
    ], text, new Date('2026-11-03T00:00:00.000Z'), 1, new Date('2026-11-01T00:00:00.000Z'));
    expect(result.verdict).toBe('RISKY');
    expect(result.unknownCount).toBe(1);
    expect(result.checklist.some((item) => item.item.includes('ISO 9001'))).toBe(true);
  });

  it('applies MSME relief only when the tender text explicitly says so', () => {
    const requirementItem = requirement('EMD', { amountInr: 900_000 }, 'EMD is Rs. 9 lakh.');
    const noRelief = evaluateEligibility(profile, [requirementItem], 'EMD is Rs. 9 lakh.');
    const withRelief = evaluateEligibility(profile, [requirementItem], 'MSME bidders are exempt from EMD. EMD is Rs. 9 lakh.');
    expect(noRelief.reasons[0]?.status).toBe('RISK');
    expect(withRelief.reasons[0]?.status).toBe('PASS');
  });

  it('marks low confidence and unreadable thresholds unknown without guessing', () => {
    const result = evaluateEligibility(profile, [
      { ...requirement('TURNOVER', { minimumInr: 'unknown' }, 'An uncertain threshold clause'), confidence: 0.95 },
      { ...requirement('EXPERIENCE', { minimumYears: 1 }, 'At least one year experience'), confidence: 0.2 },
      requirement('LOCATION', {}, 'Eligible location is not clear'),
      requirement('CERTIFICATION', {}, 'Certification requirement is unclear'),
      requirement('DOCUMENT', {}, 'Document requirement is unclear'),
      requirement('EMD', {}, 'EMD amount is unclear'),
      requirement('OTHER', {}, 'Other special condition'),
    ], 'An uncertain threshold clause. At least one year experience. Eligible location is not clear. Certification requirement is unclear. Document requirement is unclear. EMD amount is unclear. Other special condition.');
    expect(result.verdict).toBe('RISKY');
    expect(result.reasons).toHaveLength(7);
    expect(result.reasons.every((item) => item.status === 'UNKNOWN')).toBe(true);
  });

  it('checks state, certification, document, EMD and alternate value field names', () => {
    const result = evaluateEligibility(profile, [
      requirement('LOCATION', { location: 'All India' }, 'Eligible location: All India.'),
      requirement('CERTIFICATION', { certification: 'ISO 27001' }, 'ISO 27001 certificate is mandatory.'),
      requirement('DOCUMENT', { document: 'GST Registration' }, 'GST Registration must be submitted.'),
      requirement('DOCUMENT', { required: 'Audited financial statements' }, 'Audited financial statements are required.'),
      requirement('EXPERIENCE', { years: 1 }, 'At least one year experience.'),
      requirement('TURNOVER', { minInr: '₹15 lakh' }, 'Minimum turnover is ₹15 lakh.'),
      requirement('EMD', { emdInr: 100_000 }, 'EMD is Rs. 1 lakh.'),
    ], 'Eligible location: All India. ISO 27001 certificate is mandatory. GST Registration must be submitted. Audited financial statements are required. At least one year experience. Minimum turnover is ₹15 lakh. EMD is Rs. 1 lakh.');
    expect(result.reasons.map((item) => item.status)).toEqual(['PASS', 'FAIL', 'PASS', 'RISK', 'PASS', 'PASS', 'PASS']);
    expect(result.verdict).toBe('DONT_BID');
    expect(result.checklist.some((item) => item.item.includes('Audited financial statements'))).toBe(true);
    expect(result.checklist.some((item) => item.item.includes('Arrange EMD'))).toBe(true);
    expect(result.checklist.some((item) => item.item.includes('experience'))).toBe(true);
  });

  it('uses a deadline risk only for a future closing date within three days', () => {
    const soon = evaluateEligibility(profile, [], '', new Date('2026-11-03T00:00:00Z'), 0, new Date('2026-11-01T00:00:00Z'));
    const expired = evaluateEligibility(profile, [], '', new Date('2026-10-31T00:00:00Z'), 0, new Date('2026-11-01T00:00:00Z'));
    const later = evaluateEligibility(profile, [], '', new Date('2026-11-05T00:00:00Z'), 0, new Date('2026-11-01T00:00:00Z'));
    expect(soon.verdict).toBe('RISKY');
    expect(soon.checklist).toHaveLength(1);
    expect(expired.verdict).toBe('BID');
    expect(later.verdict).toBe('BID');
  });

  it('keeps all-india and MSME relief precise, and clamps failure scores at zero', () => {
    const hardFailures = evaluateEligibility(profile, [
      requirement('TURNOVER', { minimum: 99_000_000 }, 'Minimum turnover Rs 99 crore.'),
      requirement('EXPERIENCE', { minimum: 100 }, 'Minimum 100 years of experience.'),
      requirement('LOCATION', { requiredLocation: 'Gujarat' }, 'Only Gujarat registered firms.'),
      requirement('CERTIFICATION', { required: 'ISO 9001' }, 'ISO 9001 is mandatory.'),
    ], 'Minimum turnover Rs 99 crore. Minimum 100 years of experience. Only Gujarat registered firms. ISO 9001 is mandatory.');
    const noTargetRelief = evaluateEligibility(profile, [requirement('EMD', { amount: 900_000 }, 'EMD is Rs. 9 lakh.')], 'MSME bidders are exempt from turnover. EMD is Rs. 9 lakh.');
    expect(hardFailures.score).toBe(0);
    expect(noTargetRelief.verdict).toBe('RISKY');
  });

  it('drops short evidence quotes and normalizes unicode text', () => {
    expect(normalizeEvidence('  ÅBC — ₹12,000! ')).toBe('abc12000');
    const result = validateEvidenceQuotes('Tender condition: GST number required for every bidder.', [
      { sourceQuote: 'GST' },
      { sourceQuote: 'GST number required for every bidder' },
      { sourceQuote: 'condition not present in tender text' },
    ]);
    expect(result.valid).toHaveLength(1);
    expect(result.dropped).toHaveLength(2);
  });
});
