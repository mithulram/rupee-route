# RupeeRoute — Security & Compliance Notes

> **This document describes engineering controls for a sandbox demo.** It does **not** assert regulatory approval, licensing, passporting, or operational readiness for live financial services.

## Sandbox posture

- **No live payment credentials** are stored or used
- **`LIVE_TRANSFERS_ENABLED` must remain `false`** — services call `assertSandboxMode()` at startup
- UI surfaces display a **sandbox banner** on web, mobile, and admin
- Copy avoids claims of instant delivery or fabricated legal thresholds

## Authentication

- Email + password registration restricted to corridor countries (`DE`, `CH`)
- Passwords hashed with bcrypt before persistence
- JWT bearer tokens for protected API routes (customer `kind: user`, admin `kind: admin`)
- Admin RBAC enforced via role matrix (`support`, `compliance`, `finance`, `admin`, `auditor`)
- Secrets (`JWT_SECRET`, `WEBHOOK_SIGNING_SECRET`) validated via Zod at startup

## API hardening (Phase 5)

- Helmet security headers on API
- Rate limiting via `@nestjs/throttler`
- Correlation IDs on requests for traceability
- CI secret pattern scan (`scripts/check-secrets.sh`) and gitleaks job

## Data protection

- Structured logs redact PII fields (email, password, token, IBAN, phone, address, etc.)
- Audit events store operational payloads; sensitive values should not be placed in audit payloads
- `.env` files are gitignored; `.env.example` contains placeholders only

## Financial integrity controls

| Control                        | Status                                              |
| ------------------------------ | --------------------------------------------------- |
| Integer minor units (`bigint`) | Implemented in `@rupeeroute/domain`                 |
| Transfer state machine         | Implemented with worker-only financial transitions  |
| Double-entry ledger            | Implemented; journal balance invariant tests        |
| Idempotency keys               | API middleware + DB table                           |
| Webhook signature verification | Provider SDK HMAC + dedup                           |
| Client financial state guard   | Security tests block client-initiated state changes |
| Immutable audit events         | Prisma model + `buildAuditEvent()` helper           |
| Live transfer kill switch      | `LIVE_TRANSFERS_ENABLED` + `assertSandboxMode()`    |

## Dependency & supply chain

GitHub Actions runs:

- `pnpm audit --audit-level high`
- Trivy filesystem scan (CRITICAL/HIGH)
- SBOM generation and gitleaks secret scan

## WCAG (planned)

Phase 3+ will target **WCAG 2.2 AA** with automated axe checks in CI. Current web/admin UIs use semantic landmarks, form labels, and sandbox banners; full accessibility CI is not yet implemented (see `FINAL_VERIFICATION_REPORT.md`).

## Reporting

This sandbox is for partner demos and engineering evaluation only. Do not use it to process real customer funds or personal data beyond local development.
