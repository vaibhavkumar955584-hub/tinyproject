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

**Status:** Strict typecheck, lint, shared unit tests, 90% coverage thresholds, and web/API production builds pass. GitHub Actions is configured to run migration, seed, and the browser smoke flow on Postgres. The latest remote run still fails at `prisma migrate deploy`; its detailed step log requires GitHub sign-in and is not available to this session. The browser run could not execute locally because Docker/Postgres is unavailable.

## Current verification

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed (12 shared tests; API/web unit suites currently have no tests).
- `pnpm test:coverage`: passed (100% statements/lines/functions and 93.27% branches for eligibility).
- `pnpm exec playwright test --list`: passed (one login → search → evidence smoke test discovered).
- `pnpm build`: passed (Next.js and NestJS production builds).

## Neon deployment update — 2026-11-01

- Initialized Neon for the existing `production` branch and enabled the Postgres service; `neon deploy` applied the branch policy and pulled the pooled and direct database URLs into the ignored root `.env`.
- Added `@neon/config` and `@neon/env`, generated the root `neon.ts` branch policy, and ignored `.env.local` as well as `.env` and `.neon`.
- Configured Prisma application connections to use the pooled URL and Prisma migrations to use the direct URL. The pg-boss worker uses the direct URL for its long-lived connection and starts after module initialization completes.
- Applied the initial Prisma migration to Neon and confirmed the migration status is up to date. Fixed the initial SQL migration's trailing escaped newline that prevented PostgreSQL from parsing it.
- API health returned `{"status":"ok","database":"ok"}` while the API and pg-boss worker were running, proving the service can connect to Neon and execute a query. The production Next.js server returned HTTP 200 and rendered the TenderGuard home page.
- Added AuthModule exports/imports needed for JWT and guard resolution and documented the Neon/local database setup in the architecture guide.
- `npm run build`: passed after Neon wiring. The pre-existing Next.js dev server on port 3000 returned a stale dev-runtime error during the HTTP smoke check; the production server on port 3001 passed the HTTP check. The API end-to-end health check passed.
- The Neon CLI emitted a `pg-connection-string` forward-compatibility warning about SSL mode aliases; the current connection succeeded with TLS. No browser sign-in was requested by the CLI.

## Brand and UI system update — 2026-11-01

- Installed and authenticated the 21st.dev Codex skills/CLI; reviewed its `SeaGreen Minimal` theme and adapted its calm surfaces and restrained green accent to TenderGuard's existing warm paper, brown, steel-blue, red, and green palette.
- Added the supplied transparent TenderGuard wordmark and shield mark to the landing, login/register, workspace navigation, and app icon. Added the shared `BrandLogo` component.
- Added a project-aware 21st design context under `.21st/` and recorded the shared theme/logo rules in `docs/ui-design.md`.
- Extended the shared light/dark system across route-level surfaces, added accessible theme controls across public/auth/workspace screens, and completed shared loading skeleton and toast feedback patterns for search and watchlist flows.
- `npm run build`: passed after the UI update. 21st UI review reported mostly palette-literal and capped-width heuristics; the only animation warning on the search progress meter was changed to a width-only transition.
