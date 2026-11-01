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

Demo account after seeding: `demo@tenderguard.local` / `TenderGuardDemo123!`. Fixture mode is the default and requires no external API keys. Use a separate local database for demos; rotate the seed password before any shared deployment.

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
| `pnpm db:up` / `pnpm db:down` | Start/stop Postgres |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Create demo profile and user |
| `pnpm db:studio` | Open Prisma Studio |

## Environment and deployment

Copy `.env.example` to `.env`. The template contains only local defaults and blank provider credential fields. Never commit real credentials. Required variables and safe defaults are validated in `packages/shared/src/env.ts`.

For deployment, use a managed PostgreSQL instance and separate web/API deployments (for example Vercel plus Render or Railway). Set a randomly generated `JWT_SECRET`, exact `WEB_ORIGIN`, secure database URL, and only the provider credentials enabled for that deployment. Run migrations as a release step. Do not expose `.env` or use the development seed account in production.

## Current limitations

- API and browser end-to-end smoke tests are not yet present; current tests focus on shared eligibility and environment validation.
- Live portal search and notification delivery need real credentials and a running database for end-to-end verification.
- Database migration/seed and full local run require Docker. Check [the phase log](docs/phase-log.md) for verification results and known gaps.
