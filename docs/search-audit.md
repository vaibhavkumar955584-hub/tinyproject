# TenderGuard AI Search Audit: Why Only CPPP/eProcure Responds Today

**Audit Date**: November 2026  
**Auditor**: TenderGuard Core Engineering  
**Scope**: Root cause analysis of current single/dual portal bottleneck and multi-portal fan-out roadmap.

---

## 1. Executive Summary

Currently, TenderGuard AI only returns active tenders from CPPP (`eprocure.gov.in`) and occasionally GeM (`gem.gov.in`). Searches for state-level procurement (e.g. Uttar Pradesh, Maharashtra, Tamil Nadu GePNIC), Indian Railways (`ireps.gov.in`), Defence (`defproc.gov.in`), or PSUs fail to surface relevant opportunities.

This bottleneck stems from six structural limitations in the codebase:
1. **Hardcoded Domain Whitelist**: `allowedSourceHosts` in `tinyfish-web-agent.adapter.ts` restricts queries strictly to `eprocure.gov.in` and `gem.gov.in`. Any other portal URL discovered by TinyFish Search is dropped.
2. **Type-Level Constraint**: `@tenderguard/shared` defines `TenderSource` as `z.enum(['CPPP', 'GEM'])`, preventing registration of state GePNIC portals, Railways, or Defence.
3. **Raw Unoptimized Query**: The search string is passed verbatim into `https://api.search.tinyfish.ai` as `${input.query} tender notice ${domain}`. Lacks Hindi transliteration (e.g. "सीसीटीवी"), synonyms ("surveillance", "ip camera"), or category/state qualification.
4. **Single-Agent Browser Dispatch**: In `search-jobs.service.ts`, the live browser runner selects only the first portal (`job.sources[0] ?? 'CPPP'`) and navigates only to `https://eprocure.gov.in/eprocure/app` or `https://gem.gov.in/bids`.
5. **Fixture Limitations**: In demo/fixture mode, `FixtureWebAgent` only reads `fixtures/cppp` and `fixtures/gem`.
6. **Frontend Hardcoding**: The UI tabs and source toggles on `/search` only contain buttons for `CPPP` and `GeM`.

---

## 2. Root Cause Analysis

### 2.1 Domain Whitelist & Host Checking
In `apps/api/src/agent/tinyfish-web-agent.adapter.ts`:
```ts
const allowedSourceHosts: Record<TenderSource, string[]> = {
  CPPP: ['eprocure.gov.in'],
  GEM: ['gem.gov.in'],
};
```
Method `isAllowedUrl(url, source)` strictly validates that the hostname matches `eprocure.gov.in` or `gem.gov.in`. State portals such as `etender.up.nic.in` (UP GePNIC), `mahatenders.gov.in` (Maharashtra GePNIC), or `ireps.gov.in` are automatically filtered out.

### 2.2 Unoptimized Keyword Passing
When a user searches for `"cctv camera"`, no expansion takes place:
- Portals frequently title tenders as *"Supply and installation of IP based video surveillance system"*, *"CCTV surveillance cameras"*, or *"क्लोज्ड सर्किट टेलीविजन"*.
- Without a Query Optimizer, search queries miss high-relevance tenders due to exact term mismatch.

### 2.3 Single Live Browser Runner
In `search-jobs.service.ts`:
```ts
const primarySource = job.sources[0] ?? 'CPPP';
const listingUrl = primarySource === 'GEM' ? 'https://gem.gov.in/bids' : 'https://eprocure.gov.in/eprocure/app';
```
The streaming browser session only opens a single portal.

---

## 3. Remedy & Architectural Solution Plan

1. **Query Optimizer (Phase 1)**:
   - Takes raw keyword + business profile.
   - Generates `QueryPlan` with normalized terms, intent (`goods` | `services` | `works`), canonical terms, synonyms, Hindi translations/transliterations, negative terms, and portal-specific subqueries.
   - LLM-powered with deterministic fast fallback (<1.5s timeout budget) and 24h caching.

2. **Config-Driven Portal Registry (Phase 2)**:
   - Support `CPPP`, `GEM`, `GEPNIC` (generic adapter with per-state baseUrls: UP, MP, MH, TN, WB, GJ, RJ, KA, etc.), `IREPS` (Railways), and `DEFENCE`.
   - Track `PortalHealth` in the database with circuit breakers.

3. **Smart 3-Tier Fan-Out with TinyFish (Phase 3)**:
   - Dynamic portal selection scoring (`stateMatch + sectorMatch + priority + health`).
   - Tier 1: Multi-domain Search API in parallel.
   - Tier 2: Fetch API for direct document/PDF extraction.
   - Tier 3: Agent SSE runner for live portal navigation.
   - Budgets & circuit breaker to prevent quota waste.

4. **Normalization, Deduplication & Relevance Scoring (Phase 4)**:
   - Deduplicate across portals (`sourceTenderId` or fuzzy token match > 0.85).
   - Display canonical tender with `alsoOn: ['GeM', 'UP GePNIC']`.
   - Composite relevance ranking (0–100) combining keyword density, closing recency, profile fit, and document completeness.

5. **SSE & UI Enhancement (Phases 5 & 6)**:
   - Emit `search.plan`, `portal.status`, `candidates.update`, and `tender.verdict` with portal badges.
   - Real-time portal status chips, query chips under search bar, and multi-portal filters on `/search`.

