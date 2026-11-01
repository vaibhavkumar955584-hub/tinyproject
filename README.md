# TenderGuard AI

Evidence-backed procurement decision support for Indian small businesses and MSMEs.

> Other tools find tenders. TenderGuard tells you which ones you'll be rejected for, before you pay the EMD and spend weeks on paperwork, and it proves every answer.

**Decision support, not legal advice. Verify against the official tender document.** TenderGuard is designed for public pages only: it will not bypass CAPTCHAs, log in as a bidder, or submit bids. A CAPTCHA or login wall must stop that tender and be marked for a manual step.

## Current status

Phase 0 scaffold is in place. The app shells, shared package, local Postgres service, environment template, and documentation are ready. Product features are added one phase at a time; see [the phase log](docs/phase-log.md) and [architecture notes](docs/architecture.md).

The original TinyFish workshop Python examples remain in the repository during the transition.

## Quickstart

Requirements: Node.js 20+, pnpm 10+, and Docker Compose.

```powershell
Copy-Item .env.example .env
pnpm install
pnpm db:up
pnpm dev
```

The web shell is at `http://localhost:3000`; the API health endpoint is `http://localhost:4000/api/health`. Postgres is available on port 5432. Current phase does not yet require API provider keys; fixture mode is the default.

To stop Postgres, run `pnpm db:down`.

## Workspace

```text
apps/web       Next.js App Router shell
apps/api       NestJS REST API shell
packages/shared Shared Zod schemas and environment parsing
docs/          Architecture and phase notes
fixtures/      Tender HTML/PDF text fixtures (added in Phase 2/3)
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start web and API in parallel |
| `pnpm build` | Build workspace packages |
| `pnpm lint` | Lint workspace packages |
| `pnpm typecheck` | Type-check workspace packages |
| `pnpm test` | Run workspace tests |
| `pnpm db:up` | Start PostgreSQL 16 |
| `pnpm db:migrate` | Apply Prisma migrations (introduced in Phase 1) |
| `pnpm db:seed` | Seed development data (introduced in Phase 1) |
| `pnpm db:studio` | Open Prisma Studio (introduced in Phase 1) |

## Environment

Copy `.env.example` to `.env`. The example contains only local development defaults and blank provider credential fields. Never commit real credentials. Environment schema lives in `packages/shared/src/env.ts`.

## UI design

The product brief specifies an accessible responsive interface with indigo `#3730A3`, teal `#0D9488`, explicit verdict icons and labels, and an evidence drawer for exact source clauses. Stitch MCP was requested for UI design, but a Stitch connector is not currently available to this session. See [the UI integration note](docs/architecture.md#ui-design-integration).

## Phased implementation

The build follows the approved phase gates in the supplied product brief. Work pauses after each phase for the user to say `continue`. Read [docs/phase-log.md](docs/phase-log.md) for completed checks and known limitations.
