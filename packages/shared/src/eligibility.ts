import type { ChecklistItem, ProfileInput, RequirementStatus, RequirementType, Verdict } from './index.js';

export interface TenderRequirement {
  id?: string;
  type: RequirementType;
  valueJson: Record<string, unknown>;
  sourceUrl: string;
  sourceQuote: string;
  confidence: number;
}

export interface EvaluatedRequirement {
  requirement: TenderRequirement;
  status: RequirementStatus;
  explanation: string;
  profileValue?: unknown;
  tenderValue?: unknown;
}

export interface EligibilityResult {
  verdict: Verdict;
  score: number;
  reasons: EvaluatedRequirement[];
  checklist: ChecklistItem[];
  unknownCount: number;
}

export function normalizeEvidence(value: string): string {
  return value.toLocaleLowerCase('en-IN').normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '');
}

export function validateEvidenceQuotes<T extends { sourceQuote: string }>(
  rawText: string,
  requirements: T[],
): { valid: T[]; dropped: T[] } {
  const normalizedText = normalizeEvidence(rawText);
  const valid: T[] = [];
  const dropped: T[] = [];
  for (const requirement of requirements) {
    const quote = normalizeEvidence(requirement.sourceQuote);
    if (quote.length >= 8 && normalizedText.includes(quote)) valid.push(requirement);
    else dropped.push(requirement);
  }
  return { valid, dropped };
}

function numberFrom(value: unknown, keys: string[]): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const numeric = candidate.replace(/,/g, '').match(/\d+(?:\.\d+)?/)?.[0];
      if (!numeric) continue;
      const multiplier = /crore|cr\b/i.test(candidate) ? 10_000_000 : /lakh|lac|lacs/i.test(candidate) ? 100_000 : /thousand/i.test(candidate) ? 1_000 : 1;
      const parsed = Number(numeric) * multiplier;
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function stringFrom(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) if (typeof record[key] === 'string') return record[key] as string;
  return undefined;
}

function msmeRelaxationApplies(text: string, type: RequirementType): boolean {
  const clauses = text.toLocaleLowerCase('en-IN').split(/[.!?;\n]+/);
  const exemption = /exempt(?:ion)?|waiv(?:er|ed)|relax(?:ation|ed)?|not required/;
  const msme = /msme|mse|micro and small|micro small/;
  const target = type === 'TURNOVER' ? /turnover|financial criteria/ : type === 'EMD' ? /emd|earnest money/ : /turnover|emd/;
  return clauses.some((clause) => msme.test(clause) && exemption.test(clause) && target.test(clause));
}

function evaluateRequirement(profile: ProfileInput, requirement: TenderRequirement, rawText: string): EvaluatedRequirement {
  const { type, valueJson } = requirement;
  if (requirement.confidence < 0.5) return { requirement, status: 'UNKNOWN', explanation: 'The tender clause is unclear; verify it in the official document.' };

  if ((type === 'TURNOVER' || type === 'EMD') && profile.msmeStatus !== 'NONE' && msmeRelaxationApplies(rawText, type)) {
    return { requirement, status: 'PASS', explanation: 'The tender explicitly states an MSME exemption for this requirement.', profileValue: profile.msmeStatus, tenderValue: valueJson };
  }

  if (type === 'TURNOVER') {
    const minimum = numberFrom(valueJson, ['minimumInr', 'minInr', 'minimum', 'amountInr']);
    if (minimum === undefined) return { requirement, status: 'UNKNOWN', explanation: 'The minimum turnover could not be read with confidence.' };
    if (profile.annualTurnoverInr < minimum) return { requirement, status: 'FAIL', explanation: 'Your annual turnover is below the tender minimum.', profileValue: profile.annualTurnoverInr, tenderValue: minimum };
    if ((profile.annualTurnoverInr - minimum) / minimum <= 0.1) return { requirement, status: 'RISK', explanation: 'Your turnover clears the minimum by 10% or less; verify how the tender calculates average turnover.', profileValue: profile.annualTurnoverInr, tenderValue: minimum };
    return { requirement, status: 'PASS', explanation: 'Your annual turnover exceeds the stated minimum.', profileValue: profile.annualTurnoverInr, tenderValue: minimum };
  }

  if (type === 'EXPERIENCE') {
    const minimum = numberFrom(valueJson, ['minimumYears', 'years', 'minimum']);
    if (minimum === undefined) return { requirement, status: 'UNKNOWN', explanation: 'The experience requirement could not be read with confidence.' };
    const status = profile.experienceYears >= minimum ? 'PASS' : 'FAIL';
    return { requirement, status, explanation: status === 'PASS' ? 'Your experience meets the stated minimum.' : 'Your recorded experience is below the tender minimum.', profileValue: profile.experienceYears, tenderValue: minimum };
  }

  if (type === 'LOCATION') {
    const location = stringFrom(valueJson, ['state', 'location', 'requiredLocation']);
    if (!location) return { requirement, status: 'UNKNOWN', explanation: 'The eligible location could not be read with confidence.' };
    const matches = location.toLocaleLowerCase('en-IN').includes(profile.state.toLocaleLowerCase('en-IN')) || /all india|any state|nationwide/i.test(location);
    return { requirement, status: matches ? 'PASS' : 'FAIL', explanation: matches ? 'Your registered state is included in the eligible location.' : 'Your registered state does not match the stated location requirement.', profileValue: profile.state, tenderValue: location };
  }

  if (type === 'CERTIFICATION') {
    const name = stringFrom(valueJson, ['name', 'certification', 'required']);
    if (!name) return { requirement, status: 'UNKNOWN', explanation: 'The required certification could not be identified.' };
    const has = profile.certifications.some((certification) => normalizeEvidence(certification) === normalizeEvidence(name));
    return { requirement, status: has ? 'PASS' : 'FAIL', explanation: has ? 'Your profile includes the required certification.' : `Your profile does not list ${name}.`, profileValue: profile.certifications, tenderValue: name };
  }

  if (type === 'DOCUMENT') {
    const name = stringFrom(valueJson, ['name', 'document', 'required']);
    if (!name) return { requirement, status: 'UNKNOWN', explanation: 'The required document could not be identified.' };
    const has = profile.documentsHeld.some((document) => normalizeEvidence(document) === normalizeEvidence(name));
    return { requirement, status: has ? 'PASS' : 'RISK', explanation: has ? 'Your profile lists this document.' : `Your profile does not list ${name}; add it before bidding.`, profileValue: profile.documentsHeld, tenderValue: name };
  }

  if (type === 'EMD') {
    const amount = numberFrom(valueJson, ['amountInr', 'emdInr', 'amount']);
    if (amount === undefined) return { requirement, status: 'UNKNOWN', explanation: 'The EMD amount could not be read with confidence.' };
    const risk = amount > profile.annualTurnoverInr * 0.05;
    return { requirement, status: risk ? 'RISK' : 'PASS', explanation: risk ? 'The EMD exceeds 5% of your recorded annual turnover; check funding and any stated exemption.' : 'The EMD is within 5% of your recorded annual turnover.', profileValue: profile.annualTurnoverInr, tenderValue: amount };
  }

  return { requirement, status: 'UNKNOWN', explanation: 'This clause needs a manual eligibility review.' };
}

export function buildChecklist(profile: ProfileInput, requirements: TenderRequirement[], closingAt?: Date | null): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  for (const requirement of requirements.filter((item) => item.type === 'DOCUMENT')) {
    const name = stringFrom(requirement.valueJson, ['name', 'document', 'required']);
    if (name && !profile.documentsHeld.some((document) => normalizeEvidence(document) === normalizeEvidence(name))) {
      items.push({ item: `Prepare ${name}`, done: false, why: `The tender requires ${name}, which is not in your profile.`, quote: requirement.sourceQuote });
    }
  }
  const emd = requirements.find((item) => item.type === 'EMD');
  const emdAmount = emd ? numberFrom(emd.valueJson, ['amountInr', 'emdInr', 'amount']) : undefined;
  if (emdAmount !== undefined) items.push({ item: `Arrange EMD of ${formatInr(emdAmount)}`, done: false, why: 'Confirm the amount, payment method, and any exemption in the official tender.' , quote: emd?.sourceQuote });
  const experience = requirements.find((item) => item.type === 'EXPERIENCE');
  const years = experience ? numberFrom(experience.valueJson, ['minimumYears', 'years', 'minimum']) : undefined;
  if (years !== undefined) items.push({ item: `Prepare evidence for ${years} years of experience`, done: false, why: 'Collect completion certificates and work orders that satisfy the tender wording.', quote: experience?.sourceQuote });
  if (closingAt) items.push({ item: `Submit before ${closingAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}`, done: false, why: 'Verify the portal deadline and time zone, especially after corrigenda.' });
  return items;
}

export function evaluateEligibility(
  profile: ProfileInput,
  requirements: TenderRequirement[],
  rawText: string,
  closingAt?: Date | null,
  droppedQuoteCount = 0,
  now = new Date(),
): EligibilityResult {
  const evaluated = requirements.map((requirement) => evaluateRequirement(profile, requirement, rawText));
  if (closingAt) {
    const days = (closingAt.getTime() - now.getTime()) / 86_400_000;
    if (days <= 3 && days >= 0) {
      evaluated.push({ requirement: { type: 'OTHER', valueJson: {}, sourceUrl: 'https://example.com', sourceQuote: 'Closing date', confidence: 1 }, status: 'RISK', explanation: 'The tender closes within 3 days; confirm the deadline and readiness immediately.', tenderValue: closingAt.toISOString() });
    }
  }
  if (droppedQuoteCount > 0) evaluated.push({ requirement: { type: 'OTHER', valueJson: {}, sourceUrl: 'https://example.com', sourceQuote: 'Evidence verification', confidence: 0 }, status: 'UNKNOWN', explanation: `${droppedQuoteCount} extracted clause(s) could not be verified against the tender text.` });
  const hardFails = evaluated.filter((item) => item.status === 'FAIL').length;
  const risks = evaluated.filter((item) => item.status === 'RISK' || item.status === 'UNKNOWN').length;
  const missingDocs = evaluated.filter((item) => item.requirement.type === 'DOCUMENT' && item.status === 'RISK').length;
  const score = Math.max(0, 100 - 40 * hardFails - 10 * Math.max(0, risks - missingDocs) - 5 * missingDocs);
  const verdict: Verdict = hardFails > 0 ? 'DONT_BID' : risks > 0 ? 'RISKY' : 'BID';
  return { verdict, score, reasons: evaluated, checklist: buildChecklist(profile, requirements, closingAt), unknownCount: droppedQuoteCount };
}

function formatInr(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
}
