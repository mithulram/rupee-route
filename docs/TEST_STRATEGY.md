# RupeeRoute — Test Strategy

## CI pipeline

Every push/PR to `projects/rupee-route/` runs:

1. **Install** — `pnpm install --frozen-lockfile`
2. **Database** — Prisma generate + migrate against ephemeral Postgres/Redis
3. **Lint** — ESLint strict across monorepo
4. **Typecheck** — TypeScript strict mode per package
5. **Unit tests** — Vitest in packages and apps
6. **Build** — Turbo builds all apps and packages
7. **Security** — `pnpm audit` + Trivy filesystem scan

## Test layers

| Layer         | Scope                                                    | Tool                   | Status                             |
| ------------- | -------------------------------------------------------- | ---------------------- | ---------------------------------- |
| Unit          | Money, state machine, RBAC, ledger, webhooks, monitoring | Vitest                 | Implemented                        |
| Component     | Web UI components (`StatusBadge`, etc.)                  | Vitest + jsdom         | Implemented                        |
| Integration   | API + Postgres consumer flow                             | Supertest + NestJS     | Implemented                        |
| Contract      | OpenAPI spec load                                        | Vitest                 | Implemented                        |
| E2E web       | Landing, auth, send flow, dashboard                      | Playwright             | Specs exist — must pass on Node 22 |
| Accessibility | WCAG 2.x on landing, login, authenticated send           | `@axe-core/playwright` | Specs exist — must pass on Node 22 |
| Mobile smoke  | Login + send quote step                                  | Maestro                | **Not started** (Phase 4 blocked)  |

See [FINAL_VERIFICATION_REPORT.md](./FINAL_VERIFICATION_REPORT.md) for audit details.

## Local commands

```bash
pnpm test                              # all unit + integration tests (turbo)
pnpm --filter @rupeeroute/web test     # web component tests (Vitest)
pnpm --filter @rupeeroute/api test     # API unit + integration tests
pnpm --filter @rupeeroute/web test:e2e  # Playwright E2E (all browsers/viewports)
pnpm --filter @rupeeroute/web test:a11y # axe accessibility checks only
pnpm lint
pnpm typecheck
pnpm build
pnpm format:check
```

### Prerequisites

- **Postgres + Redis** — `pnpm docker:up` (or local equivalents)
- **Migrations** — `pnpm db:migrate`
- **`LIVE_TRANSFERS_ENABLED=false`** — never enable live transfers in tests

## Web E2E (Playwright)

Config: `apps/web/playwright.config.ts`

Projects cover **Chromium, Firefox, and WebKit** across **desktop (1280×720), tablet (768×1024), and mobile** viewports.

```bash
# Terminal 1 — API (requires DATABASE_URL)
pnpm dev:api

# Terminal 2 — E2E (starts Next.js dev server automatically)
pnpm --filter @rupeeroute/web test:e2e

# Accessibility-only run
pnpm --filter @rupeeroute/web test:a11y

# Reuse an already-running web server
PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm --filter @rupeeroute/web test:e2e

# Custom URLs
PLAYWRIGHT_BASE_URL=http://localhost:3000 PLAYWRIGHT_API_URL=http://localhost:3001 pnpm --filter @rupeeroute/web test:e2e
```

Specs live in `apps/web/e2e/`:

- `landing.spec.ts` — hero, calculator, auth links
- `auth.spec.ts` — register + login (requires API)
- `send-flow.spec.ts` — send stepper + quote step (requires API)
- `dashboard.spec.ts` — authenticated dashboard (requires API)
- `a11y.spec.ts` — axe on `/` and `/login`

Install browsers once: `pnpm --filter @rupeeroute/web exec playwright install`

## API integration tests

File: `apps/api/src/integration/consumer-flow.integration.test.ts`

Uses NestJS `TestingModule` + Supertest against a real Postgres when `DATABASE_URL` is set. The suite is **skipped automatically** when `DATABASE_URL` is unset (`describe.skip`).

Flow covered: register → login → quote → recipient → transfer draft → attach recipient → confirm attempt (sandbox-only; no live transfers).

```bash
pnpm docker:up
pnpm db:migrate
pnpm --filter @rupeeroute/api test
```

## Mobile smoke (Maestro)

Flows at `.maestro/flows/`:

| Flow              | Purpose                       |
| ----------------- | ----------------------------- |
| `login.yaml`      | Sign in and reach home tab    |
| `send-smoke.yaml` | Login → amount → quote screen |

```bash
# Build or run the sandbox app on a simulator/device first
pnpm dev:mobile

# Install Maestro: https://maestro.mobile.dev/getting-started/installing-maestro
export MAESTRO_TEST_EMAIL=you@example.com
export MAESTRO_TEST_PASSWORD=sandbox-pass-123

maestro test .maestro/flows/login.yaml
maestro test .maestro/flows/send-smoke.yaml
```

**App ID:** `com.rupeeroute.sandbox` (see `apps/mobile/app.json`). For Expo Go during development, override with `appId: host.exp.Exponent` in the flow file.

Ensure `EXPO_PUBLIC_API_URL` points at your local API and the API is running.

## Test data

Sandbox uses deterministic provider seeds (`rupeeroute-sandbox`). No production or live PSP fixtures. E2E and integration tests create ephemeral users with `@sandbox.rupeeroute.test` emails.

## Coverage goals (future)

- State machine: 100% transition matrix coverage
- Ledger: invariant tests that every journal entry balances to zero
- Webhook idempotency: duplicate delivery does not double-post
