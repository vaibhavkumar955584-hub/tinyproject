import { FanOutService, tokenSimilarity } from './fan-out.service';
import type { CircuitBreakerService } from '../agent/portals/circuit-breaker.service';
import type { QueryPlan, TenderCandidate } from '@tenderguard/shared';

describe('FanOutService', () => {
  let service: FanOutService;
  let mockCircuit: jest.Mocked<CircuitBreakerService>;

  beforeEach(() => {
    mockCircuit = {
      isAvailable: jest.fn().mockResolvedValue(true),
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      recordFailure: jest.fn().mockResolvedValue(undefined),
      getHealthMap: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<CircuitBreakerService>;

    service = new FanOutService(mockCircuit);
  });

  describe('tokenSimilarity', () => {
    it('returns 1.0 for identical sentences', () => {
      const s1 = 'Supply and installation of CCTV cameras in Lucknow';
      const s2 = 'Supply and installation of CCTV cameras in Lucknow';
      expect(tokenSimilarity(s1, s2)).toBe(1.0);
    });

    it('returns high similarity (>0.85) for minor word variations', () => {
      const s1 = 'Supply and installation of CCTV surveillance cameras in Lucknow';
      const s2 = 'Supply and installation of CCTV surveillance cameras at Lucknow';
      expect(tokenSimilarity(s1, s2)).toBeGreaterThan(0.85);
    });

    it('returns low similarity for different tenders', () => {
      const s1 = 'Road construction and highway repair in Gorakhpur';
      const s2 = 'IT helpdesk support and computer hardware supply';
      expect(tokenSimilarity(s1, s2)).toBeLessThan(0.3);
    });
  });

  describe('selectPortals', () => {
    it('prioritizes IREPS when query contains railway keywords', async () => {
      const plan: QueryPlan = {
        original: 'railway coach cctv',
        normalized: 'railway coach cctv',
        intent: 'goods',
        canonicalTerms: ['cctv'],
        synonyms: ['camera'],
        hindiTerms: [],
        excludeTerms: [],
        categoryHints: [],
        stateHints: [],
        portalQueries: {},
      };

      const portals = await service.selectPortals(plan);
      const portalIds = portals.map((p) => p.id);
      expect(portalIds).toContain('IREPS');
      expect(portalIds).toContain('CPPP');
      expect(portalIds).toContain('GEM');
    });

    it('prioritizes state portal when state matches profile', async () => {
      const plan: QueryPlan = {
        original: 'cctv cameras',
        normalized: 'cctv cameras',
        intent: 'goods',
        canonicalTerms: ['cctv'],
        synonyms: [],
        hindiTerms: [],
        excludeTerms: [],
        categoryHints: [],
        stateHints: ['Uttar Pradesh'],
        portalQueries: {},
      };

      const portals = await service.selectPortals(plan);
      const portalIds = portals.map((p) => p.id);
      expect(portalIds).toContain('GEPNIC_UP');
    });
  });

  describe('deduplicateCandidates', () => {
    it('deduplicates across portals using sourceTenderId and adds alsoOn', () => {
      const c1: TenderCandidate = {
        portalId: 'CPPP',
        sourceTenderId: '2026_CPPP_98120_1',
        title: 'Managed IT Helpdesk Services',
        department: 'NIC',
        location: 'Delhi',
        closingDate: '2026-12-01T00:00:00.000Z',
        detailUrl: 'https://eprocure.gov.in/notice1',
        discoveredVia: 'search',
        alsoOn: [],
        relevance: 85,
      };

      const c2: TenderCandidate = {
        portalId: 'GEM',
        sourceTenderId: '2026_CPPP_98120_1',
        title: 'Managed IT Helpdesk Services - Central Mirror',
        department: 'NIC',
        location: 'Delhi',
        closingDate: '2026-12-01T00:00:00.000Z',
        detailUrl: 'https://gem.gov.in/bid1',
        discoveredVia: 'fetch',
        alsoOn: [],
        relevance: 80,
      };

      const deduped = service.deduplicateCandidates([c1, c2]);
      expect(deduped.length).toBe(1);
      expect(deduped[0]!.portalId).toBe('CPPP');
      expect(deduped[0]!.alsoOn).toContain('GEM');
    });

    it('deduplicates fuzzy matching titles (>0.85 similarity)', () => {
      const c1: TenderCandidate = {
        portalId: 'CPPP',
        sourceTenderId: 'TNDR-111',
        title: 'Supply and installation of CCTV cameras in Lucknow Collectorate',
        department: 'Public Works Department',
        location: 'Lucknow',
        detailUrl: 'https://eprocure.gov.in/noticeA',
        discoveredVia: 'search',
        alsoOn: [],
        relevance: 85,
      };

      const c2: TenderCandidate = {
        portalId: 'GEPNIC_UP',
        sourceTenderId: 'TNDR-222',
        title: 'Supply and installation of CCTV cameras at Lucknow Collectorate',
        department: 'Public Works Department',
        location: 'Lucknow',
        detailUrl: 'https://etender.up.nic.in/noticeB',
        discoveredVia: 'search',
        alsoOn: [],
        relevance: 90,
      };

      const deduped = service.deduplicateCandidates([c1, c2]);
      expect(deduped.length).toBe(1);
      expect(deduped[0]!.alsoOn).toContain('GEPNIC_UP');
    });
  });

  describe('calculateRelevance', () => {
    it('scores high relevance (>80) for exact keyword and active deadline', () => {
      const plan: QueryPlan = {
        original: 'cctv camera',
        normalized: 'cctv camera',
        intent: 'goods',
        canonicalTerms: ['cctv camera'],
        synonyms: ['surveillance'],
        hindiTerms: ['सीसीटीवी'],
        excludeTerms: [],
        categoryHints: [],
        stateHints: ['Uttar Pradesh'],
        portalQueries: {},
      };

      const candidate = {
        title: 'Supply of CCTV Camera for District Hospital',
        department: 'Medical Health Department',
        location: 'Uttar Pradesh',
        closingDate: new Date(Date.now() + 86400000 * 10).toISOString(),
        estimatedValueInr: 2500000,
        portalId: 'GEPNIC_UP',
      };

      const result = service.calculateRelevance(candidate, plan, { state: 'Uttar Pradesh' });
      expect(result.relevance).toBeGreaterThan(80);
      expect(result.whyMatched).toContain('Exact keyword match in title');
      expect(result.whyMatched).toContain('Target state fit');
    });
  });
});
