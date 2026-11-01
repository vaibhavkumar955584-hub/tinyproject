import type { TenderSource } from '@tenderguard/shared';
import type { RequirementType } from '@tenderguard/shared';

export interface SearchQuery {
  query: string;
  sources: TenderSource[];
}

export interface TenderRef {
  source: TenderSource;
  sourceTenderId: string;
  url: string;
  titleHint: string;
  department?: string | null | undefined;
  location?: string | null | undefined;
  estimatedValueInr?: number | null | undefined;
  emdInr?: number | null | undefined;
  publishedAt?: string | null | undefined;
  closingAt?: string | null | undefined;
}

export interface RawTender extends TenderRef {
  title: string;
  rawText: string;
  fetchStatus: 'OK' | 'FETCH_FAILED' | 'NEEDS_MANUAL_STEP';
  reason?: string;
  fixtureRequirements?: Array<{ type: RequirementType; valueJson: Record<string, unknown>; sourceQuote: string }> | undefined;
}

export interface WebAgentPort {
  discover(query: SearchQuery): Promise<TenderRef[]>;
  fetchDetails(ref: TenderRef): Promise<RawTender>;
}

export const WEB_AGENT_PORT = Symbol('WEB_AGENT_PORT');
