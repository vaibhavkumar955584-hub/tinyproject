# TenderGuard AI — API Contract

This document defines the contract between the Next.js frontend (`apps/web`) and the NestJS backend (`apps/api`). The backend MUST match this contract. Frontend changes should be minimal and only where noted below.

## Base
- Global prefix: `/api`
- All responses JSON. SSE endpoint is `text/event-stream`.
- Frontend calls with `credentials: 'include'` (cookies).
- API URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`)

## Error Shape (all endpoints)
```json
{ "statusCode": number, "code": string, "message": string, "details?": any }
```
Stable `code` strings: `AUTH_REQUIRED`, `INVALID_SESSION`, `AUTH_INVALID`, `PROFILE_REQUIRED`, `PROFILE_NOT_FOUND`, `VALIDATION_ERROR`, `SEARCH_JOB_NOT_FOUND`, `QUEUE_UNAVAILABLE`, `QUEUE_REJECTED`, `TENDER_NOT_FOUND`, `WATCH_NOT_FOUND`, `TINYFISH_NOT_CONFIGURED`, `LLM_NOT_CONFIGURED`, `PORTAL_SEARCH_FAILED`, `GOOGLE_AUTH_NOT_CONFIGURED`, `INVALID_GOOGLE_CREDENTIAL`, `UNVERIFIED_GOOGLE_ACCOUNT`, `GOOGLE_ACCOUNT_CONFLICT`, `INTERNAL_ERROR`, `RATE_LIMITED`, `DEMO_ONLY`, `INVALID_CHAT_ID`, `INVALID_CSRF_TOKEN`.

## Auth

### POST /auth/register
Body: `{ email: string, password: string }` (validated by `registerInputSchema`)
Response 201: `{ user: { id: string, email: string } }`
Sets httpOnly cookie `tg_session`.
**MISSING**: Backend currently only has Google OAuth (`POST /auth/google`). Email/password register/login endpoints do not exist. Frontend `AuthForm` calls `/auth/register` and `/auth/login`. **Proposal: add email/password register + login endpoints.**

### POST /auth/login
Body: `{ email: string, password: string }`
Response 200: `{ user: { id: string, email: string } }`
Sets httpOnly cookie `tg_session`.
**MISSING**: Not implemented. **Proposal: add.**

### POST /auth/logout
Clears `tg_session` cookie.
Response 200: `{ ok: true }`
**Status**: Implemented (clears `access_token` cookie — needs rename to `tg_session`).

### GET /auth/me
Response 200: `{ id: string, email: string, hasProfile: boolean }`
**Status**: Implemented. Cookie name mismatch (`access_token` → `tg_session`).

**Cookie config issues (backend → requirement):**
- Cookie name: `access_token` → should be `tg_session`
- Cookie path: `/api` → should be `/`
- SameSite: hardcoded `lax` → should be `None` in production (cross-site), `Lax` in dev
- Secure: driven by `NODE_ENV === 'production'` ✓
- **CSRF**: Backend checks header `x-requested-with: XmlHttpRequest`. Requirement says `X-Requested-With: tenderguard`. Frontend `api()` does NOT send this header. **Proposal: update backend to check `tenderguard`, update frontend `api()` to send `X-Requested-With: tenderguard` on state-changing requests.**

## Profile

### GET /profile
Response 200: `ProfileInput` with `annualTurnoverInr` as **string** (BigInt serialized).
409 `PROFILE_NOT_FOUND` if no profile.
**Status**: Implemented. BigInt → string ✓.

### PUT /profile
Body: `ProfileInput`
Response 200: updated profile with `annualTurnoverInr` as string.
**Status**: Implemented.

## Search Jobs

### POST /search-jobs
Body: `{ query: string, sources: string[] }` (validated by `searchInputSchema`)
Requires saved profile (else 409 `PROFILE_REQUIRED`).
Response 202: `{ jobId: string }`
**Status**: Implemented. Throttler: 10/min (requirement says 10/hour/user — needs adjustment).

### GET /search-jobs/:id
Response 200: `{ id, status, progress, results: TenderCardData[], logs? }`
`TenderCardData` shape (must match frontend):
```json
{
  "id": string,
  "source": "CPPP" | "GEM",
  "sourceTenderId": string,
  "title": string,
  "department": string | null,
  "location": string | null,
  "closingAt": string | null,
  "estimatedValueInr": string | null,
  "emdInr": string | null,
  "fetchStatus": "OK" | "FETCH_FAILED" | "NEEDS_MANUAL_STEP",
  "verdict": { "verdict": "BID" | "RISKY" | "DONT_BID", "score": number, "reasons": [{ "explanation": string, "status": string }] } | null,
  "watch": { "id": string } | null
}
```
Requirement adds: `daysLeft`, `topReason`, `sourceUrl`. Frontend computes `daysLeft` client-side from `closingAt`; `sourceUrl` maps to `url`; `topReason` not used by current frontend.
**Status**: Mostly implemented. Backend returns extra fields (rawText, contentHash, publishedAt, lastFetchedAt) — harmless. Missing `daysLeft`, `topReason`, `sourceUrl` (frontend doesn't require them yet).

### GET /search-jobs/:id/events (SSE)
Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
Auth: cookie `tg_session` (withCredentials).
Events: `activity` (id, step, detail, ts), `complete` (status, progress).
Heartbeat comment every 15s.
Supports `Last-Event-ID` / `after` query param for replay.
**Status**: Implemented via polling (not true SSE stream). Missing: heartbeat, `X-Accel-Buffering`, true event-stream headers, `Last-Event-ID` replay (uses `after` timestamp instead).

## Tenders

### GET /tenders/:id
Response 200: TenderDetail with requirements, verdict, watch, sourceUrl.
**Status**: Implemented.

### GET /tenders/:id/verdict
Returns just the verdict object.
**Status**: Implemented.

## Watches

### POST /watches
Body: `{ tenderId: string, intervalHours?: number }`
Response: watch object.
**Status**: Implemented.

### GET /watches
Response: watch list with tender info.
**Status**: Implemented.

### PATCH /watches/:id
Body: `{ active: boolean }`
**Status**: Implemented.

### DELETE /watches/:id
Response: `{ ok: true }`
**Status**: Implemented.

## Alerts

### GET /alerts
Response: alert list with tender info, verdictBefore/After.
**Status**: Implemented.

### PATCH /alerts/:id/read
**MISSING**: Not implemented. Frontend doesn't call it yet but requirement lists it.

## Telegram

### POST /telegram/link
Body: `{ chatId: string }`
Response: `{ linked: true }`
**Status**: Implemented.

### POST /telegram/webhook
**MISSING**: Not implemented (verify secret token header, store chatId).

## Analyze (Chrome extension)

### POST /analyze
Body: `{ url, pageText, pdfUrl? }`
Auth: Bearer token.
Rate limited. Max body 1 MB.
Response: verdict payload.
**MISSING**: Not implemented.

## Health

### GET /health
Response: `{ status, database, queue, agentMode, version }` with db latency.
**Status**: Partially implemented (returns `{ status: 'ok', database: 'ok' }`). Missing: queue status, agent mode, version, latency.

## Dev (ENABLE_DEV_ROUTES=true)

### POST /dev/simulate-corrigendum/:tenderId
**Status**: Implemented at `/dev/tenders/:id/simulate-corrigendum` (path mismatch — requirement says `/dev/simulate-corrigendum/:tenderId`).

## BigInt Serialization
Money fields (`estimatedValueInr`, `emdInr`, `annualTurnoverInr`) serialized as **strings** of rupees (e.g. `"3000000"`). Backend converts BigInt → string in profile and tender services. **Needs a global interceptor** so no endpoint ever throws on BigInt.

## Dates
ISO 8601 strings.

## Pagination
List endpoints: `?cursor=&limit=` (default 20, max 50). **Not implemented** — current endpoints return all rows.

## OpenAPI
`/api/docs` via @nestjs/swagger, disabled in production unless `ENABLE_DOCS=true`. **Not implemented**.

---

## Summary of Required Backend Changes (minimal, non-breaking)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Missing POST /auth/register and POST /auth/login | Add email/password auth endpoints |
| 2 | Cookie name `access_token` | Rename to `tg_session` |
| 3 | Cookie path `/api` | Change to `/` |
| 4 | SameSite hardcoded `lax` | Switch to `None` in production, `Lax` in dev |
| 5 | CSRF header `XmlHttpRequest` | Change to `X-Requested-With: tenderguard` |
| 6 | Frontend `api()` doesn't send CSRF header | Add `X-Requested-With: tenderguard` on mutating requests |
| 7 | `DATABASE_URL_UNPOOLED` in schema.prisma | Rename env to `DIRECT_URL` per Neon rules |
| 8 | No global BigInt interceptor | Add response interceptor |
| 9 | No Swagger | Add @nestjs/swagger at /api/docs |
| 10 | Throttler: 10/min global | Per-route: auth 5/min, search 10/hour/user |
| 11 | No Prisma retry wrapper | Add retry for P1001/P1017/ECONNRESET |
| 12 | No keep-warm cron | Add every 4 min if KEEP_DB_WARM=true |
| 13 | SSE missing headers | Add X-Accel-Buffering, heartbeat 15s, Last-Event-ID replay |
| 14 | pg-boss uses DATABASE_URL_UNPOOLED | Use DIRECT_URL |
| 15 | Missing PATCH /alerts/:id/read | Add endpoint |
| 16 | Missing POST /analyze | Add endpoint |
| 17 | Dev route path mismatch | `/dev/tenders/:id/simulate-corrigendum` → `/dev/simulate-corrigendum/:tenderId` |
