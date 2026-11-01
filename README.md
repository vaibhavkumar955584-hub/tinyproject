# TenderGuard AI

Evidence-backed procurement decision support for Indian small businesses and MSMEs.

> Other tools find tenders. TenderGuard tells you which ones you'll be rejected for, before you pay the EMD and spend weeks on paperwork, and it proves every answer.

**Decision support, not legal advice. Verify against the official tender document.** TenderGuard reads public pages only. It will not bypass CAPTCHAs, log in as a bidder, or submit bids. A CAPTCHA or login wall stops analysis for that tender and asks for a manual step.

## Quickstart

Requirements: Node.js 20+, pnpm 10+, and Docker Compose.

```powershell
Copy-Item .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`. API health is at `http://localhost:4000/api/health`. Mailpit inbox is at `http://localhost:8025`.

Authentication is Google-only. Set `GOOGLE_CLIENT_ID` for the API and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for the web app to the same Google OAuth **web client ID**. In Google Cloud Console, add the app origin (for local development, `http://localhost:3000`) to the OAuth client's authorized JavaScript origins, and add the intended users to the OAuth consent screen's test-user list while the app is in testing. The API verifies Google's ID token before creating or linking a TenderGuard account; no Google client secret is used by this flow. Never commit a downloaded OAuth client JSON file.

The seed command adds a demo business profile to the database, but no demo password exists. Sign in with a real Google account to access the app. Fixture mode is the default and requires no external AI API keys.

## Demo flow

1. Sign in with the demo account and review the seeded IT services profile (Uttar Pradesh, ₹30 lakh turnover, two years of experience, small MSME).
2. Open Find Tenders and run a query such as `IT services` with CPPP and GeM selected.
3. Follow the agent activity timeline, then open a result. Fixture data demonstrates BID, RISKY, and DONT_BID outcomes.
4. Inspect each requirement's exact quote, source link, confidence, and readiness checklist. Export the checklist using the browser print dialog and choose Save as PDF.
5. Add a tender to the watchlist and choose **Simulate change** to create a fixture-only deadline corrigendum. Review the before/after card in Alerts. In a configured deployment, optional SMTP and Telegram delivery are supported.

## Live portal mode

Set `AGENT_MODE=live` and configure `TINYFISH_API_KEY` in the local `.env`. TinyFish Search and Fetch requests are made through the `WebAgentPort` adapter. Live mode is constrained to HTTPS procurement portal hosts and is not verified end-to-end without configured credentials and a running database. TinyFish docs: [Search API](https://docs.tinyfish.ai/search-api), [Fetch API](https://docs.tinyfish.ai/fetch-api), [Agent API](https://docs.tinyfish.ai/agent-api).

## Workspace

```text
apps/web        Next.js App Router interface
apps/api        NestJS REST API, SSE, queue, and Prisma access
packages/shared Shared Zod contracts and deterministic eligibility rules
fixtures/       Clearly labeled demonstration tender fixtures
docs/           Architecture, phase log, and Stitch visual reference
```

See [architecture](docs/architecture.md), [UI design notes](docs/ui-design.md), and [phase log](docs/phase-log.md).

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start web and API |
| `pnpm build` | Build all workspace apps |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run shared/API/web unit tests |
| `pnpm test:coverage` | Enforce 90% eligibility coverage thresholds |
| `pnpm test:e2e` | Run the Playwright Google-only login and registration UI smoke flow |
| `pnpm db:up` / `pnpm db:down` | Start/stop Postgres |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Create the fixture demo profile (sign-in still requires Google) |
| `pnpm db:studio` | Open Prisma Studio |

## Environment and deployment

Copy `.env.example` to `.env`. The template contains only local defaults and blank provider credential fields. Never commit real credentials. Required variables and safe defaults are validated in `packages/shared/src/env.ts`.

For deployment, use a managed PostgreSQL instance and separate web/API deployments (for example Vercel plus Render or Railway). Set a randomly generated `JWT_SECRET`, exact `WEB_ORIGIN`, secure database URL, and only the provider credentials enabled for that deployment. Run migrations as a release step. Do not expose `.env` or use the development seed account in production.

## Current limitations

- The Playwright auth smoke test is wired into CI. Running it locally requires Google web client ID configuration and Chromium (`pnpm exec playwright install chromium`).
- The latest GitHub Actions run currently fails during `prisma migrate deploy`; see [the phase log](docs/phase-log.md). The run's detailed logs are restricted to signed-in GitHub users.
- Live portal search and notification delivery need real credentials and a running database for end-to-end verification.
- Database migration/seed and full local run require Docker. Check [the phase log](docs/phase-log.md) for verification results and known gaps.
