# RupeeRoute — Architecture

## System context

```
┌─────────┐ ┌─────────┐ ┌─────────┐
│   Web   │ │ Mobile  │ │  Admin  │
│ Next.js │ │  Expo   │ │ Next.js │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └───────────┼───────────┘
                 ▼
          ┌─────────────┐
          │  NestJS API │
          └──────┬──────┘
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
┌─────────┐ ┌────────┐ ┌──────────────┐
│ Postgres│ │ Redis  │ │ Worker (BullMQ)│
│ Prisma  │ │ queue  │ │ webhooks/jobs │
└─────────┘ └────────┘ └───────┬──────┘
                               ▼
                    ┌──────────────────────┐
                    │ Sandbox provider SDK │
                    └──────────────────────┘
```

## Monorepo layout

| Path                     | Responsibility                                                      |
| ------------------------ | ------------------------------------------------------------------- |
| `apps/api`               | REST API, JWT auth, OpenAPI docs, webhook ingress (future)          |
| `apps/worker`            | Background jobs; sole orchestrator for post-payment transfer states |
| `apps/web`               | Consumer Next.js app                                                |
| `apps/admin`             | Internal operations console                                         |
| `apps/mobile`            | Expo iOS/Android app                                                |
| `packages/domain`        | Money types, audit helpers, Prisma schema                           |
| `packages/config`        | Zod env validation, feature flags                                   |
| `packages/observability` | Pino logging with PII redaction                                     |
| `packages/design-system` | Shared design tokens                                                |
| `packages/api-contracts` | OpenAPI spec + TS types                                             |
| `packages/provider-sdk`  | Deterministic sandbox provider interfaces                           |

## Data architecture

### Money

All amounts are **integer minor units** with ISO 4217 currencies (`EUR`, `CHF`, `INR`). Floating-point must not be used for storage or ledger math.

### Audit events

`audit_events` is **append-only**. Application code inserts rows via `buildAuditEvent()`; updates and deletes are prohibited by convention and review.

### Idempotency

`idempotency_keys` table supports safe retries on mutating API calls and webhook delivery (Phase 2+).

## Security boundaries

- **Public routes:** `/health`, `/api/v1/auth/*`, OpenAPI docs
- **Authenticated routes:** `/api/v1/me` (JWT bearer)
- **Worker-only advancement:** transfer state changes after payment require worker or verified provider webhook (Phase 2+)
- **Feature flag:** `LIVE_TRANSFERS_ENABLED=false` — startup fails if set true in sandbox build

## Observability

Structured JSON logs via `@rupeeroute/observability` with automatic PII field redaction (email, tokens, IBAN, etc.).

## Local infrastructure

Docker Compose provides PostgreSQL 16 and Redis 7. See [README.md](../README.md) for exact commands.
