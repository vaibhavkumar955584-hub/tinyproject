# TenderGuard AI

Evidence-backed procurement decision support for Indian small businesses and MSMEs.

> Other tools find tenders. TenderGuard tells you which ones you'll be rejected for, before you pay the EMD and spend weeks on paperwork, and it proves every answer.

**Decision support, not legal advice. Verify against the official tender document.** TenderGuard reads public pages only. It will not bypass CAPTCHAs, log in as a bidder, or submit bids. A CAPTCHA or login wall stops analysis for that tender and asks for a manual step.

## Quickstart

Requirements: Node.js 20+, pnpm 10+, and Neon PostgreSQL (or local Docker Postgres).

```powershell
Copy-Item .env.example .env
# Edit .env: set DATABASE_URL, DIRECT_URL, JWT_SECRET, GOOGLE_*, WEB_ORIGINS, TINYFISH_API_KEY
pnpm install
npx prisma generate --filter @tenderguard/api
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`. API health is at `http://localhost:4000/api/health`. Mailpit inbox is at `http://localhost:8025`.

### Authentication (email/password + Google)

TenderGuard supports email/password registration and login, plus Google OAuth sign-in:

- **Email/password:** `POST /api/auth/register` and `POST /api/auth/login` set an HTTP-only `tg_session` cookie. Password minimum 10 characters.
- **Google:** `GET /api/auth/google/csrf` returns a CSRF token, then `POST /api/auth/google` exchanges the Google authorization code with CSRF check via `X-Requested-With: tenderguard` header.
- **Session:** `GET /api/auth/me` returns `{ id, email, hasProfile }`. `POST /api/auth/logout` clears the cookie.
- **CSRF:** All state-changing auth endpoints require the `X-Requested-With: tenderguard` header. The web `api()` helper sends this by default.

Set `GOOGLE_CLIENT_ID`, server-only `GOOGLE_CLIENT_SECRET`, plus `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for the web app. In Google Cloud Console, add the app origin to the OAuth client's authorized JavaScript origins, and add intended users to the OAuth consent screen's test-user list while the app is in testing. Never commit a downloaded OAuth client JSON file or expose the secret in a `NEXT_PUBLIC_*` variable.

The seed command adds a demo business profile to the database. Sign in with email/password or a real Google account to access the app. Fixture mode (`AGENT_MODE=fixture`) is the default and requires no external AI API keys.

## Demo flow

1. Sign in with email/password or Google, then review your business profile (category, state, turnover, experience, MSME status).
2. Open Find Tenders and run a query such as `IT helpdesk support` with CPPP and GeM selected.
3. Follow the agent activity timeline. Live mode streams TinyFish agent events (`STARTED → STREAMING_URL → PROGRESS → COMPLETE`) via SSE at `GET /api/search-jobs/:id/events`. The `streaming_url` can be embedded in an iframe for a live agent browser view.
4. Open a result. Fixture data demonstrates BID, RISKY, and DONT_BID outcomes.
5. Inspect each requirement's exact quote, source link, confidence, and readiness checklist. Export the checklist using the browser print dialog and choose Save as PDF.
6. Add a tender to the watchlist and choose **Simulate change** to create a fixture-only deadline corrigendum. Review the before/after card in Alerts. In a configured deployment, optional SMTP and Telegram delivery are supported.

## Live portal mode (TinyFish)

Set `AGENT_MODE=live` and configure `TINYFISH_API_KEY` in the local `.env`. TinyFish Search, Fetch, and Agent requests are made through the `WebAgentPort` adapter and `TinyFishService`.

- `POST /api/agent/stream` — runs a TinyFish agent and returns collected events (started/live/step/done).
- `GET /api/agent/stream-sse` — SSE stream of live agent events.
- `POST /api/agent/cancel` — cancels a running TinyFish run by `runId`.

Live mode is constrained to HTTPS procurement portal hosts (`eprocure.gov.in`, `gem.gov.in`). It is not verified end-to-end without configured credentials and a running database. TinyFish docs: [Search API](https://docs.tinyfish.ai/search-api), [Fetch API](https://docs.tinyfish.ai/fetch-api), [Agent API](https://docs.tinyfish.ai/agent-api).

## Workspace

```text
apps/web        Next.js App Router interface
apps/api        NestJS REST API, SSE, queue, and Prisma access
packages/shared Shared Zod contracts and deterministic eligibility rules
fixtures/       Clearly labeled demonstration tender fixtures
docs/           Architecture, phase log, and Stitch visual reference
```

See [architecture](docs/architecture.md), [UI design notes](docs/ui-design.md), [API contract](docs/api-contract.md), and [phase log](docs/phase-log.md).

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start web and API |
| `pnpm build` | Build all workspace apps |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run shared/API/web unit tests |
| `pnpm test:coverage` | Enforce 90% eligibility coverage thresholds |
| `pnpm test:e2e` | Run the Playwright auth UI smoke flow |
| `pnpm db:up` / `pnpm db:down` | Start/stop Postgres |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Create the fixture demo profile |
| `pnpm db:studio` | Open Prisma Studio |
| `npx prisma generate --filter @tenderguard/api` | Regenerate Prisma Client |

## Environment and deployment

Copy `.env.example` to `.env`. The template contains only local defaults and blank provider credential fields. Never commit real credentials. Required variables and safe defaults are validated in `packages/shared/src/env.ts`.

**Key environment variables:**

| Variable | Purpose | Required |
|---|---|---|
| `DATABASE_URL` | Pooled Neon connection string (with `pgbouncer=true&connect_timeout=15&sslmode=require`) | Yes |
| `DIRECT_URL` | Direct Neon connection (for Prisma migrations and pg-boss) | Yes |
| `JWT_SECRET` | Signing secret for session JWTs (min 32 chars) | Yes |
| `WEB_ORIGINS` | Comma-separated allowed frontend origins | Yes |
| `WEB_ORIGIN_REGEX` | Regex for additional allowed origins | No |
| `COOKIE_MODE` | `same-site` (dev) or `cross-site` (prod) | Yes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (server-side only) | No |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID for frontend | No |
| `TINYFISH_API_KEY` | TinyFish agent/search/fetch key | No (fixture mode default) |
| `AGENT_MODE` | `fixture` or `live` | No (default: fixture) |

For deployment, use a managed PostgreSQL instance and separate web/API deployments (for example Vercel plus Render or Railway). Set a randomly generated `JWT_SECRET`, exact `WEB_ORIGINS`, secure database URL, and only the provider credentials enabled for that deployment. Run migrations as a release step. Do not expose `.env` or use the development seed account in production.

## Current limitations

- The Playwright auth smoke test is wired into CI. Running it locally requires Google web client ID configuration and Chromium (`pnpm exec playwright install chromium`).
- Live portal search and notification delivery need real credentials and a running database for end-to-end verification.
- Custom TinyFish `agent_config.max_steps` requires beta program enrollment; default config works without it.
- Database migration/seed and full local run require Docker. Check [the phase log](docs/phase-log.md) for verification results and known gaps.
