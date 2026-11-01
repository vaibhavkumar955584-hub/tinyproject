import { Injectable, Logger } from '@nestjs/common';
import type { QueryPlan, TenderCandidate } from '@tenderguard/shared';
import { PORTAL_REGISTRY, type PortalRegistryEntry, getPortalById } from '../agent/portals/registry';
import { CircuitBreakerService } from '../agent/portals/circuit-breaker.service';

const AGGREGATOR_DOMAINS = [
  'tender18.com',
  'tender247.com',
  'bideasy.in',
  'indiamart.com',
  'bidassist.com',
  'tenderbulletin.com',
  'eprocurementindia.org',
];

export function tokenSimilarity(a: string, b: string): number {
  const normA = new Set(
    a
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
  const normB = new Set(
    b
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
  if (normA.size === 0 || normB.size === 0) return 0;

  let intersection = 0;
  for (const item of normA) {
    if (normB.has(item)) intersection++;
  }
  return (2 * intersection) / (normA.size + normB.size);
}

@Injectable()
export class FanOutService {
  private readonly logger = new Logger(FanOutService.name);
  private readonly MAX_PORTALS_DEFAULT = 6;
  private readonly MAX_PORTALS_CAP = 15;

  constructor(private readonly circuit: CircuitBreakerService) {}

  async selectPortals(
    plan: QueryPlan,
    requestedPortals?: string[] | 'all',
  ): Promise<PortalRegistryEntry[]> {
    const enabled = PORTAL_REGISTRY.filter((p) => p.enabled);

    // If explicit portals requested
    if (Array.isArray(requestedPortals) && requestedPortals.length > 0) {
      const explicit = requestedPortals
        .map((id) => getPortalById(id))
        .filter((p): p is PortalRegistryEntry => p !== undefined && p.enabled);
      if (explicit.length > 0) return explicit;
    }

    const qText = `${plan.original} ${plan.normalized} ${plan.canonicalTerms.join(' ')}`.toLowerCase();
    const scored: Array<{ portal: PortalRegistryEntry; score: number }> = [];

    for (const portal of enabled) {
      let score = portal.priority * 10;

      // Always high baseline for National Portals CPPP & GeM
      if (portal.id === 'CPPP') score += 20;
      if (portal.id === 'GEM') score += 18;

      // Sector-specific routing
      const isRailwayQuery = /railway|train|coach|locomotive|station|track|irctc|ireps/i.test(qText);
      if (isRailwayQuery && portal.id === 'IREPS') score += 35;

      const isDefenceQuery = /defence|defense|army|navy|air\s*force|drdo|ordnance|military|weapon|radar/i.test(qText);
      if (isDefenceQuery && portal.id === 'DEFENCE') score += 35;

      // State matching (from profile or query)
      const stateMatch = plan.stateHints.some((st) =>
        portal.states.some((ps) => ps.toLowerCase().includes(st.toLowerCase()) || st.toLowerCase().includes(ps.toLowerCase())),
      );
      if (stateMatch) {
        score += 25;
      }

      // Check Circuit Breaker availability
      const isHealthy = await this.circuit.isAvailable(portal.id);
      if (!isHealthy) {
        score -= 50;
      }

      scored.push({ portal, score });
    }

    scored.sort((a, b) => b.score - a.score);

    const limit = requestedPortals === 'all' ? this.MAX_PORTALS_CAP : this.MAX_PORTALS_DEFAULT;
    return scored.slice(0, limit).map((s) => s.portal);
  }

  isAggregatorLead(urlStr: string): boolean {
    try {
      const url = new URL(urlStr);
      return AGGREGATOR_DOMAINS.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
    } catch {
      return false;
    }
  }

  calculateRelevance(
    candidate: {
      title: string;
      department?: string | null | undefined;
      location?: string | null | undefined;
      closingDate?: string | null | undefined;
      estimatedValueInr?: number | null | undefined;
      snippet?: string | undefined;
      portalId: string;
    },
    plan: QueryPlan,
    profile?: { state?: string | undefined; category?: string | undefined } | undefined,
  ): { relevance: number; whyMatched: string } {
    let score = 0;
    const reasons: string[] = [];

    const titleLower = candidate.title.toLowerCase();
    const snippetLower = (candidate.snippet || '').toLowerCase();
    const deptLower = (candidate.department || '').toLowerCase();

    // 1. Keyword / Synonym match (35%)
    const hasCanonical = plan.canonicalTerms.some((t) => titleLower.includes(t.toLowerCase()));
    const hasSynonym = plan.synonyms.some((s) => titleLower.includes(s.toLowerCase()));
    const hasHindi = plan.hindiTerms.some((h) => titleLower.includes(h.toLowerCase()) || snippetLower.includes(h.toLowerCase()));

    if (hasCanonical) {
      score += 35;
      reasons.push(`Exact keyword match in title`);
    } else if (hasSynonym || hasHindi) {
      score += 25;
      reasons.push(hasHindi ? `Hindi keyword match` : `Synonym match in title`);
    } else if (plan.canonicalTerms.some((t) => snippetLower.includes(t.toLowerCase()) || deptLower.includes(t.toLowerCase()))) {
      score += 18;
      reasons.push(`Term match in notice description`);
    } else {
      score += 8;
    }

    // 2. Freshness & Closing date (20%)
    if (candidate.closingDate) {
      const closing = new Date(candidate.closingDate).getTime();
      const now = Date.now();
      const daysLeft = (closing - now) / (1000 * 3600 * 24);
      if (daysLeft > 0 && daysLeft <= 30) {
        score += 20;
        reasons.push(`Active notice closing in ${Math.ceil(daysLeft)}d`);
      } else if (daysLeft > 30) {
        score += 15;
      } else {
        score += 0; // Expired
      }
    } else {
      score += 10;
    }

    // 3. Profile fit (20%)
    const targetState = (profile?.state || plan.stateHints[0] || '').toLowerCase();
    if (targetState && (candidate.location?.toLowerCase().includes(targetState) || deptLower.includes(targetState))) {
      score += 12;
      reasons.push(`Target state fit (${profile?.state || plan.stateHints[0]})`);
    }
    if (profile?.category && (titleLower.includes(profile.category.toLowerCase()) || deptLower.includes(profile.category.toLowerCase()))) {
      score += 8;
    }

    // 4. Source Authority (15%)
    const portal = getPortalById(candidate.portalId);
    if (portal?.priority && portal.priority >= 4) {
      score += 15;
      reasons.push(`Official gazette portal (${portal.name.split(' ')[0]})`);
    } else {
      score += 10;
    }

    // 5. Completeness (10%)
    if (candidate.estimatedValueInr && candidate.estimatedValueInr > 0) score += 5;
    if (candidate.department) score += 5;

    const clampedRelevance = Math.max(15, Math.min(99, Math.round(score)));
    const whyMatched = reasons.join(' · ') || `Relevant government tender match`;

    return { relevance: clampedRelevance, whyMatched };
  }

  deduplicateCandidates(candidates: TenderCandidate[]): TenderCandidate[] {
    const deduped: TenderCandidate[] = [];

    for (const cand of candidates) {
      // 1. Direct ID match
      const existingById = deduped.find(
        (existing) =>
          existing.sourceTenderId === cand.sourceTenderId &&
          cand.sourceTenderId !== '' &&
          !cand.sourceTenderId.startsWith('TNDR-'),
      );

      if (existingById) {
        if (!existingById.alsoOn.includes(cand.portalId) && existingById.portalId !== cand.portalId) {
          existingById.alsoOn.push(cand.portalId);
        }
        continue;
      }

      // 2. Fuzzy Title + Department similarity match (> 0.85)
      const existingByFuzzy = deduped.find((existing) => {
        const titleSim = tokenSimilarity(existing.title, cand.title);
        if (titleSim < 0.85) return false;

        // If departments both exist, check department match too
        if (existing.department && cand.department) {
          return tokenSimilarity(existing.department, cand.department) > 0.6;
        }
        return true;
      });

      if (existingByFuzzy) {
        if (!existingByFuzzy.alsoOn.includes(cand.portalId) && existingByFuzzy.portalId !== cand.portalId) {
          existingByFuzzy.alsoOn.push(cand.portalId);
        }
        continue;
      }

      deduped.push({ ...cand, alsoOn: [...cand.alsoOn] });
    }

    return deduped;
  }
}
