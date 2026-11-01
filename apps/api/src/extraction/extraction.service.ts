import { Inject, Injectable, Logger } from '@nestjs/common';
import { extractedTenderSchema, validateEvidenceQuotes } from '@tenderguard/shared';
import type { RequirementType, TenderRequirement } from '@tenderguard/shared';
import { LLM_PORT, type LlmPort } from '../llm/llm.port';

export interface ExtractionResult {
  title?: string;
  department?: string | null | undefined;
  location?: string | null | undefined;
  estimatedValueInr?: number | null | undefined;
  emdInr?: number | null | undefined;
  closingAt?: Date | null;
  requirements: TenderRequirement[];
  unknownCount: number;
  state: 'OK' | 'UNKNOWN';
}

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(@Inject(LLM_PORT) private readonly llm: LlmPort) {}

  async extract(rawText: string, sourceUrl: string, titleHint: string, fixtureRequirements?: Array<{ type: RequirementType; valueJson: Record<string, unknown>; sourceQuote: string }>): Promise<ExtractionResult> {
    if (fixtureRequirements) {
      const checked = validateEvidenceQuotes(rawText, fixtureRequirements);
      return {
        title: titleHint,
        requirements: checked.valid.map((requirement) => ({ ...requirement, sourceUrl, confidence: 1 })),
        unknownCount: checked.dropped.length,
        state: checked.dropped.length ? 'UNKNOWN' : 'OK',
      };
    }
    const prompt = [
      'Extract procurement eligibility facts from the tender text below.',
      'Return only JSON matching: {"title":string,"department":string|null,"location":string|null,"estimatedValueInr":integer|null,"emdInr":integer|null,"closingAt":ISO-8601|null,"requirements":[{"type":"TURNOVER|EXPERIENCE|EMD|DOCUMENT|LOCATION|CERTIFICATION|OTHER","valueJson":object,"sourceQuote":string}]}.',
      'Use INR integer amounts. Use null when absent. Never infer or guess. Every requirement must include an exact verbatim sourceQuote copied from the tender text.',
      'For TURNOVER use valueJson.minimumInr. For EXPERIENCE use valueJson.minimumYears. For EMD use valueJson.amountInr. For DOCUMENT use valueJson.name. For CERTIFICATION use valueJson.name. For LOCATION use valueJson.state.',
      `Page title: ${titleHint}`,
      'Tender text:',
      rawText.slice(0, 40_000),
    ].join('\n\n');

    let parsed;
    try {
      const first = await this.llm.generateJson(prompt);
      parsed = extractedTenderSchema.safeParse(JSON.parse(first));
      if (!parsed.success) {
        const repaired = await this.llm.generateJson(prompt, `Repair this output to match the requested JSON schema. Return JSON only. Invalid output: ${first}`);
        parsed = extractedTenderSchema.safeParse(JSON.parse(repaired));
      }
    } catch (error) {
      this.logger.warn(`Tender extraction could not be completed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return { requirements: [], unknownCount: 1, state: 'UNKNOWN' };
    }
    if (!parsed.success) return { requirements: [], unknownCount: 1, state: 'UNKNOWN' };

    const quotes = validateEvidenceQuotes(rawText, parsed.data.requirements);
    const requirements: TenderRequirement[] = quotes.valid.map((requirement) => ({
      ...requirement,
      sourceUrl,
      confidence: 0.85,
    }));
    const hasValidDate = parsed.data.closingAt ? !Number.isNaN(Date.parse(parsed.data.closingAt)) : false;
    return {
      title: parsed.data.title,
      department: parsed.data.department,
      location: parsed.data.location,
      estimatedValueInr: parsed.data.estimatedValueInr,
      emdInr: parsed.data.emdInr,
      closingAt: hasValidDate ? new Date(parsed.data.closingAt as string) : null,
      requirements,
      unknownCount: quotes.dropped.length,
      state: quotes.dropped.length > 0 ? 'UNKNOWN' : 'OK',
    };
  }
}
