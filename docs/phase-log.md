# Phase log

The user explicitly asked to complete every phase without the original phase-by-phase pause. Individual phases are recorded below; commit history records implementation milestones.

## Phase 0 — Scaffold

**Status:** Implemented and committed (`6485f06`). Created the pnpm workspace, strict TypeScript config, lint/format setup, Zod environment validation, web/API shells, PostgreSQL Compose service, and quickstart. The original Python workshop files and existing `config.py` changes were preserved.

## Phase 1 — Database, auth, and profile

**Status:** Implemented. Includes Prisma schema, initial migration and demo seed; Argon2 password hashing, JWT httpOnly cookie auth, profile endpoints, login/register screens, and two-step business onboarding.

## Phase 2 — Evidence and eligibility brain

**Status:** Implemented. Includes shared deterministic eligibility logic, quote normalization/verification, Gemini/OpenAI JSON extraction adapters with one repair attempt, and fixtures targeting BID/RISKY/DONT_BID. Twelve shared unit tests cover the environment and eligibility logic.

## Phase 3 — Search agent

**Status:** Implemented. Includes fixture/TinyFish adapters, pg-boss search queue, per-tender failure isolation, ten-result cap, concurrency of five, activity logs, SSE, and ranked search results.

## Phase 4 — Product UI

**Status:** Implemented. Landing page, onboarding, streaming search/activity feed, tender evidence inspector, checklist, watch controls, and browser print-to-PDF export. The Stitch visual reference and screenshot are in `docs/design-reference/` and `docs/ui-design.md`.

## Phase 5 — Monitoring and alerts

**Status:** Implemented watch pause/resume/remove, a 15-minute due-watch poll, structured snapshot comparison, deadline/EMD/condition alerts, optional Telegram and SMTP delivery, and a fixture-mode corrigendum simulator exposed from the watchlist. Requires a running database and configured credentials to verify delivery end-to-end.

## Phase 6 — Live mode

**Status:** TinyFish Search/Fetch adapter is implemented with public-host restrictions, retries, and manual-step detection. A live search has not been verified because the local database runtime was unavailable.

## Phase 7 — Hardening

**Status:** Strict typecheck, lint, shared unit tests, 90% coverage thresholds, and web/API production builds pass. GitHub Actions CI runs migration, seed, and the browser smoke flow on Postgres. The browser run could not execute locally because Docker/Postgres is unavailable.

## Current verification

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed (12 shared tests; API/web unit suites currently have no tests).
- `pnpm test:coverage`: passed (100% statements/lines/functions and 93.27% branches for eligibility).
- `pnpm exec playwright test --list`: passed (one login → search → evidence smoke test discovered).
- `pnpm build`: passed (Next.js and NestJS production builds).
- `pnpm db:up`: blocked because the Docker Desktop Linux engine was unavailable; migration, seed, and end-to-end flows could not be exercised in this environment.
