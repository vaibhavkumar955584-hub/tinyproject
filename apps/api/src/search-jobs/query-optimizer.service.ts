import { BadRequestException, Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { QueryPlan, QueryIntent } from '@tenderguard/shared';
import { queryPlanSchema } from '@tenderguard/shared';
import { LLM_PORT, type LlmPort } from '../llm/llm.port';

interface QueryOptimizerInput {
  query: string;
  category?: string | null | undefined;
  state?: string | null | undefined;
  turnoverInr?: number | null | undefined;
  msmeStatus?: string | null | undefined;
}

interface CacheEntry {
  plan: QueryPlan;
  expiresAt: number;
}

const COMMON_TYPOS: Record<string, string> = {
  camra: 'camera',
  cctvcam: 'cctv camera',
  serveilance: 'surveillance',
  surveilance: 'surveillance',
  netwrok: 'network',
  lapotp: 'laptop',
  stafing: 'staffing',
  manpowr: 'manpower',
  secrity: 'security',
  electrcial: 'electrical',
  maintanance: 'maintenance',
  maintenence: 'maintenance',
  desing: 'design',
  construciton: 'construction',
  hospitl: 'hospital',
  medicne: 'medicine',
};

const HINDI_TRANSLITERATIONS: Record<string, { devanagari: string; translit: string }> = {
  cctv: { devanagari: 'सीसीटीवी', translit: 'cctv' },
  camera: { devanagari: 'कैमरा', translit: 'camera' },
  security: { devanagari: 'सुरक्षा', translit: 'suraksha' },
  surveillance: { devanagari: 'निगरानी', translit: 'nigrani' },
  network: { devanagari: 'नेटवर्क', translit: 'network' },
  computer: { devanagari: 'कंप्यूटर', translit: 'computer' },
  laptop: { devanagari: 'लैपटॉप', translit: 'laptop' },
  maintenance: { devanagari: 'रखरखाव', translit: 'rakhrakhav' },
  manpower: { devanagari: 'जनशक्ति', translit: 'janshakti' },
  housekeeping: { devanagari: 'सफाई', translit: 'safai' },
  cleaning: { devanagari: 'सफाई व्यवस्था', translit: 'safai' },
  transport: { devanagari: 'परिवहन', translit: 'parivahan' },
  vehicle: { devanagari: 'वाहन', translit: 'vahan' },
  construction: { devanagari: 'निर्माण', translit: 'nirman' },
  road: { devanagari: 'सड़क निर्माण', translit: 'sadak' },
  medical: { devanagari: 'चिकित्सा', translit: 'chikitsa' },
  medicine: { devanagari: 'दवाइयां', translit: 'dawaiyan' },
  printing: { devanagari: 'मुद्रण', translit: 'mudran' },
  furniture: { devanagari: 'फर्नीचर', translit: 'furniture' },
  electrical: { devanagari: 'विद्युत', translit: 'vidyut' },
  cable: { devanagari: 'केबल', translit: 'cable' },
  pipe: { devanagari: 'पाइपलाइन', translit: 'pipeline' },
};

const SYNONYM_DICTIONARY: Record<string, string[]> = {
  cctv: ['surveillance', 'ip camera', 'video monitoring', 'nvr', 'dvr', 'security camera'],
  camera: ['cctv', 'surveillance', 'imaging device'],
  network: ['lan', 'wan', 'ethernet', 'networking equipment', 'switch', 'router', 'fiber'],
  helpdesk: ['it support', 'desktop support', 'endpoint management', 'sla support'],
  laptop: ['notebook', 'workstation', 'personal computer', 'computing hardware'],
  computer: ['desktop', 'workstation', 'pc', 'all in one'],
  server: ['rack server', 'storage system', 'compute node', 'data center'],
  cleaning: ['housekeeping', 'sanitation', 'janitorial services', 'facility upkeep'],
  security: ['guarding service', 'access control', 'patrol service', 'security personnel'],
  manpower: ['staffing', 'outsourced personnel', 'skilled labor', 'technical staff'],
  vehicle: ['transportation', 'car rental', 'fleet management', 'commercial vehicle'],
  printing: ['publishing', 'book printing', 'digital printing', 'stationery'],
  electrical: ['transformer', 'wiring', 'substation', 'lt panel', 'switchgear'],
  civil: ['building construction', 'renovation', 'infrastructure works', 'repair works'],
  hospital: ['healthcare', 'medical facility', 'clinic equipment', 'diagnostic'],
};

const STOP_WORDS = new Set([
  'tender', 'tenders', 'notice', 'inviting', 'nit', 'procurement', 'bids', 'bid',
  'wanted', 'required', 'requirement', 'for', 'in', 'and', 'the', 'of', 'to', 'at',
  'on', 'with', 'from', 'by', 'as', 'an', 'a', 'is', 'are', 'please', 'need', 'find',
]);

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TIMEOUT_MS = 1500; // Max 1.5s latency budget

  constructor(@Optional() @Inject(LLM_PORT) private readonly llm?: LlmPort) {}

  async optimize(input: QueryOptimizerInput): Promise<QueryPlan> {
    const rawQuery = (input.query ?? '').trim();
    if (!rawQuery) {
      throw new BadRequestException('Search query cannot be empty.');
    }
    if (rawQuery.length > 200) {
      throw new BadRequestException('Search query exceeds maximum length of 200 characters.');
    }

    const normalizedKey = this.normalizeQuery(rawQuery);
    const cached = this.cache.get(normalizedKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.plan;
    }

    let plan: QueryPlan | null = null;

    if (this.llm) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Query optimizer timeout exceeded 1.5s budget')), this.TIMEOUT_MS),
        );
        plan = await Promise.race([this.generateLlmPlan(rawQuery, input), timeoutPromise]);
      } catch (err) {
        this.logger.debug(`LLM query optimization skipped or timed out: ${err instanceof Error ? err.message : 'timeout'}`);
      }
    }

    if (!plan) {
      plan = this.fallbackPlan(rawQuery, input);
    }

    this.cache.set(normalizedKey, { plan, expiresAt: Date.now() + this.CACHE_TTL_MS });
    return plan;
  }

  private normalizeQuery(q: string): string {
    return q
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ');
  }

  private async generateLlmPlan(raw: string, profile: QueryOptimizerInput): Promise<QueryPlan | null> {
    const prompt = `You are TenderGuard's Indian Government Tender Query Planner.
Convert this search query and sanitized context into a JSON QueryPlan for public portals (CPPP, GeM, State GePNIC, Railways, Defence).
Respond ONLY with a valid JSON object matching the schema below. No markdown fences.

INPUT QUERY: "${raw}"
CONTEXT:
- Category: ${profile.category || 'General'}
- State: ${profile.state || 'Any'}
- MSME: ${profile.msmeStatus || 'NONE'}

SCHEMA:
{
  "original": string,
  "normalized": string,
  "intent": "goods" | "services" | "works" | "unknown",
  "canonicalTerms": string[],
  "synonyms": string[],
  "hindiTerms": string[],
  "excludeTerms": string[],
  "categoryHints": string[],
  "stateHints": string[],
  "portalQueries": {
    "CPPP": string[],
    "GEM": string[],
    "GEPNIC_UP": string[],
    "IREPS": string[]
  }
}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const rawJson = await this.llm!.generateJson(
          prompt,
          attempt === 1 ? 'Previous output was not valid JSON for QueryPlan. Output clean JSON only.' : undefined,
        );
        const parsed = JSON.parse(rawJson);
        const result = queryPlanSchema.safeParse(parsed);
        if (result.success) {
          return result.data;
        }
      } catch {}
    }
    return null;
  }

  fallbackPlan(raw: string, profile: QueryOptimizerInput): QueryPlan {
    const normalized = this.normalizeQuery(raw);
    const words = normalized.split(/\s+/).filter(Boolean);

    // 1. Correct common typos and remove stopwords
    const correctedWords = words.map((w) => COMMON_TYPOS[w] ?? w);
    const contentWords = correctedWords.filter((w) => !STOP_WORDS.has(w) && w.length > 1);
    const cleanTerm = contentWords.join(' ') || raw.toLowerCase().trim();

    // 2. Identify canonical terms & synonyms
    const canonicalTerms = [cleanTerm];
    const synonymsSet = new Set<string>();
    const hindiTermsSet = new Set<string>();

    for (const word of contentWords) {
      if (SYNONYM_DICTIONARY[word]) {
        for (const syn of SYNONYM_DICTIONARY[word]!) {
          synonymsSet.add(syn);
        }
      }
      if (HINDI_TRANSLITERATIONS[word]) {
        hindiTermsSet.add(HINDI_TRANSLITERATIONS[word]!.devanagari);
        if (HINDI_TRANSLITERATIONS[word]!.translit !== word) {
          hindiTermsSet.add(HINDI_TRANSLITERATIONS[word]!.translit);
        }
      }
    }

    // 3. Detect intent (goods, services, works, unknown)
    let intent: QueryIntent = 'unknown';
    const worksKeywords = ['construction', 'renovation', 'civil', 'road', 'building', 'pipeline', 'repair'];
    const servicesKeywords = ['maintenance', 'support', 'manpower', 'housekeeping', 'security', 'transport', 'cleaning', 'facility'];
    const goodsKeywords = ['supply', 'equipment', 'camera', 'laptop', 'computer', 'server', 'furniture', 'medicines', 'cctv', 'cable'];

    if (contentWords.some((w) => worksKeywords.includes(w))) intent = 'works';
    else if (contentWords.some((w) => servicesKeywords.includes(w))) intent = 'services';
    else if (contentWords.some((w) => goodsKeywords.includes(w))) intent = 'goods';

    // 4. State hints & category hints
    const stateHints: string[] = [];
    if (profile.state && profile.state.toLowerCase() !== 'any') {
      stateHints.push(profile.state);
    }
    const categoryHints: string[] = [];
    if (profile.category) categoryHints.push(profile.category);

    // 5. Short 1-6 word portal subqueries
    const primaryTerm = cleanTerm.slice(0, 40);
    const topSynonym = Array.from(synonymsSet)[0];
    const topHindi = Array.from(hindiTermsSet)[0];

    const portalQueries: Record<string, string[]> = {
      CPPP: [primaryTerm, ...(topSynonym ? [`${topSynonym} tender`] : [])],
      GEM: [primaryTerm, ...(topSynonym ? [topSynonym] : [])],
      GEPNIC_UP: [`${primaryTerm}${profile.state ? ` ${profile.state}` : ''}`],
      IREPS: [`railway ${primaryTerm}`],
      DEFENCE: [`defence ${primaryTerm}`],
    };

    if (topHindi) {
      portalQueries['CPPP']?.push(topHindi);
    }

    return {
      original: raw,
      normalized: cleanTerm,
      intent,
      canonicalTerms,
      synonyms: Array.from(synonymsSet).slice(0, 5),
      hindiTerms: Array.from(hindiTermsSet).slice(0, 5),
      excludeTerms: ['recruitment', 'job vacancy', 'auction notice', 'corrigendum only'],
      categoryHints,
      stateHints,
      ...(profile.turnoverInr ? { valueHint: { min: 0, max: profile.turnoverInr * 4 } } : {}),
      portalQueries,
    };
  }
}

