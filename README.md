# RupeeRoute

Premium **sandbox-to-pilot** remittance platform for verified consumers in **Germany (EUR)** and **Switzerland (CHF)** sending to **INR** recipients in India.

Built as a portfolio-grade fintech monorepo demonstrating production patterns — integer money, immutable audit trails, transfer state machines, RBAC admin operations, and deterministic sandbox providers.

## Important — sandbox only

This repository is a **public portfolio project**. It is **not** licensed or authorized for real-money remittance.

| Statement                          | Detail                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Sandbox only**                   | Deterministic sandbox providers; no live payment rails                                                                                |
| **`LIVE_TRANSFERS_ENABLED=false`** | Required default; API startup fails if set to `true`                                                                                  |
| **No real money**                  | No live credentials, no customer funds, no settlement                                                                                 |
| **No regulatory authorization**    | Not a licensed payment institution; compliance pages are placeholders                                                                 |
| **Mobile device E2E**              | Maestro iOS/Android runs pending stable hardware; **offline + unit verification is complete** (`bash scripts/test-mobile-offline.sh`) |

See [docs/FINAL_VERIFICATION_REPORT.md](./docs/FINAL_VERIFICATION_REPORT.md) for the full audit.

> **Do not deploy with live money.** Keep `LIVE_TRANSFERS_ENABLED=false` unless you have completed your own legal, compliance, and security review.

## Highlights (portfolio reviewer)

| Area             | What to look at                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Financial domain | Integer minor units, double-entry ledger, FX margin disclosure, transfer state machine         |
| Customer web     | Full sandbox send flow (amount → quote → recipient → review → funding → tracking)              |
| Native mobile    | Expo tabs, send flow, EN/DE i18n, biometrics/deep-link hooks — **19 RN unit tests**            |
| API              | NestJS REST, JWT auth, idempotency, webhook HMAC, admin RBAC, **7 Postgres integration tests** |
| Operations       | Admin console with support/compliance/finance roles, reconciliation, DLQ retry                 |
| Quality          | **133 Vitest** tests + Playwright E2E/a11y (Chromium desktop in CI)                            |
| Docs             | Architecture, operations runbook, pilot readiness checklist                                    |

### Verification status

| Surface                            | Status                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Customer web transfer flow**     | Implemented and E2E-tested (Chromium desktop smoke in CI; full multi-browser locally)                 |
| **Native mobile app**              | Implemented; lint, typecheck, build, and **offline + unit verification** complete                     |
| **iOS/Android Maestro device E2E** | Flows defined; **pending stable hardware** (beta Xcode / simulator mismatch on some machines)         |
| **Sandbox / live money**           | **Sandbox only** — `LIVE_TRANSFERS_ENABLED=false`; no real money movement or regulatory authorization |

## Prerequisites

- **Node.js 22+** (see `.nvmrc`)
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9.15.4 --activate`
- **Docker Desktop** — PostgreSQL 16 + Redis 7

## Quick start

```bash
git clone https://github.com/mithulram/rupee-route.git
cd rupee-route

# One-shot setup (copies .env files, starts Docker, installs, migrates)
bash scripts/setup-local.sh

# Or manual:
cp .env.example .env
cp apps/{api,worker,web,admin,mobile}/.env.example apps/{api,worker,web,admin,mobile}/.env
docker compose -f infra/docker-compose.yml up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Services

| Service | URL                          | Description                   |
| ------- | ---------------------------- | ----------------------------- |
| Web     | http://localhost:3000        | Consumer app (auth + landing) |
| API     | http://localhost:3001        | NestJS REST API               |
| Swagger | http://localhost:3001/docs   | API documentation             |
| Worker  | http://localhost:3002/health | BullMQ webhook processor      |
| Admin   | http://localhost:3003        | Internal ops console (RBAC)   |
| Mobile  | Expo dev tools               | `pnpm dev:mobile`             |

### Sandbox admin login (password: `sandbox123`)

| Email                    | Role          |
| ------------------------ | ------------- |
| admin@rupeeroute.local   | administrator |
| support@rupeeroute.local | support       |
| finance@rupeeroute.local | finance       |

## Quality commands

```bash
pnpm lint          # ESLint strict (17 packages)
pnpm typecheck     # TypeScript strict
pnpm test          # Vitest — 133 tests (incl. 7 API Postgres integration tests in CI)
pnpm build         # Production builds
pnpm format:check  # Prettier
bash scripts/check-secrets.sh .  # Secret pattern scan

# Mobile without simulator:
bash scripts/test-mobile-offline.sh

# Web E2E smoke (Chromium desktop):
pnpm --filter @rupeeroute/web test:e2e:smoke
```

## Monorepo layout

```
apps/
  api/          NestJS — consumer + admin API, webhooks
  worker/       BullMQ — transfer orchestration, DLQ
  web/          Next.js consumer app
  admin/        Next.js ops console (RBAC)
  mobile/       Expo React Native — tabs, send flow, i18n
packages/
  domain/       Money, quotes, ledger, state machine, Prisma
  provider-sdk/ Deterministic sandbox providers + webhook sim
  config/       Zod env validation, feature flags
  observability/ PII-safe logging, monitoring alerts
  design-system/ Shared tokens
  api-contracts/ OpenAPI spec
docs/           Architecture, runbooks, verification report
```

## API overview

**Consumer** (`/api/v1/`): auth, profile, quotes, recipients, transfers, webhooks (provider ingress)

**Admin** (`/api/v1/admin/`): RBAC-gated transfers, tickets, compliance, reconciliation, refunds, flags, audit export

OpenAPI: `packages/api-contracts/openapi.yaml`

## Feature flags

| Flag                     | Default | Purpose                                                   |
| ------------------------ | ------- | --------------------------------------------------------- |
| `LIVE_TRANSFERS_ENABLED` | `false` | Startup fails if `true` — sandbox enforcement             |
| DB kill switches         | enabled | transfer_creation, funding_method, payout_method, coupons |

## Documentation

| Document                                                                 | Purpose                |
| ------------------------------------------------------------------------ | ---------------------- |
| [docs/FINAL_VERIFICATION_REPORT.md](./docs/FINAL_VERIFICATION_REPORT.md) | Release audit results  |
| [docs/IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md)         | Phase delivery tracker |
| [docs/OPERATIONS_RUNBOOK.md](./docs/OPERATIONS_RUNBOOK.md)               | Ops procedures         |
| [docs/PILOT_READINESS.md](./docs/PILOT_READINESS.md)                     | Go-live gate checklist |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)                           | System design          |
| [docs/TEST_STRATEGY.md](./docs/TEST_STRATEGY.md)                         | Test plan              |
| [docs/screenshots/](./docs/screenshots/)                                 | UI evidence            |

## Constraints (by design)

- **Sandbox only** — no real money movement or regulatory authorization
- **`LIVE_TRANSFERS_ENABLED=false`** — enforced at startup and in CI
- Sandbox providers only — no live payment credentials
- Revenue = disclosed FX margin (no separate fee line)
- Copy avoids "instant" or "free transfer" claims
- Client API cannot advance to funded/delivered states
- Legal/compliance pages are placeholders — not legal advice
- Mobile Maestro device E2E is optional; offline/unit verification covers CI and local dev without simulators

## License

[MIT](./LICENSE) — portfolio use and reuse permitted; no warranty. Not a production financial product.

## CI

`.github/workflows/ci.yml` — install, migrate (Postgres + Redis), lint, typecheck, test, build, secret scan, SBOM, audit, Trivy.

## Sandbox deployment

| Layer                                            | Platform                                     | Status                                                        |
| ------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| Customer web                                     | [Vercel](https://vercel.com) (`apps/web`)    | Config ready — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) |
| API (embedded sandbox worker) + Postgres + Redis | [Render](https://render.com) (`render.yaml`) | Free plan: worker runs inside API container                   |
| Admin console                                    | Not deployed                                 | Local only                                                    |

**Deploy order:** Render backend → set `WEB_CORS_ORIGINS` + Vercel `NEXT_PUBLIC_API_URL` (HTTPS only) → Vercel web → `bash scripts/deploy-smoke.sh`.

**Production URL:** _Pending backend deploy — do not use localhost API URLs on Vercel._

Sandbox constraints: `LIVE_TRANSFERS_ENABLED=false`, no live credentials, no public admin.
