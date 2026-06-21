# RupeeRoute — Final Verification Report

**Audit date:** 2026-06-21  
**Scope:** Sandbox portfolio/demo readiness — **not** production, legal, or live-money readiness

---

## Public release disclaimers

| Statement                          | Status                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| **Sandbox only**                   | All providers are deterministic sandboxes; no live rails                                     |
| **`LIVE_TRANSFERS_ENABLED=false`** | Default in `.env.example`, CI, and startup guards                                            |
| **No real money movement**         | No customer funds, settlement, or live credentials                                           |
| **No regulatory authorization**    | Not a licensed payment institution; compliance copy is placeholder                           |
| **Mobile device E2E**              | Maestro on iOS/Android **pending stable hardware**; offline + unit verification **complete** |

This report does **not** constitute legal, compliance, or security certification for production use.

---

## Executive summary

| Verdict                           | Assessment                                                                  |
| --------------------------------- | --------------------------------------------------------------------------- |
| **Phase 3 (customer web)**        | **Complete** — E2E + a11y in CI; local smoke via `test:e2e:smoke`           |
| **Phase 4 (native mobile)**       | **Complete (code)** — offline verified; device Maestro **pending hardware** |
| **Portfolio / demo hosting**      | **Ready (web)** — mobile demo via unit-tested app + web parity              |
| **Production / real-money pilot** | **Not ready**                                                               |
| **Legal / compliance advice**     | **Not provided** — placeholders only                                        |

---

## Verified commands and results (2026-06-21)

Environment: **Node v22.14.0**, **pnpm 9.15.4**, Docker Postgres 16 + Redis 7.

```bash
cd rupee-route

pnpm lint                                    # PASS (17/17)
pnpm typecheck                               # PASS (17/17)
pnpm build                                   # PASS (11/11)
pnpm format:check                            # PASS

bash scripts/test-mobile-offline.sh          # PASS — 19 RN unit tests, Maestro YAML, static checks

# Low-RAM local smoke (Chromium desktop, core user flows only):
pnpm --filter @rupeeroute/web test:e2e:smoke

# Full multi-browser suite — run in CI:
pnpm --filter @rupeeroute/web test:e2e       # 210 passed (2026-06-20 baseline)
pnpm --filter @rupeeroute/web test:a11y     # 99 passed (2026-06-20 baseline)
```

### API PostgreSQL integration tests

```bash
cd apps/api && set -a && . ./.env && set +a
SANDBOX_FORCE_KYC_APPROVED=true pnpm exec vitest run src/integration/
# 7 passed — confirm/cancel empty body, idempotency replay, cross-user 404,
# duplicate webhooks, webhook auth, financial-state protection, CI DATABASE_URL guard
```

### Security CI (release-blocking)

- gitleaks — **required** (no `continue-on-error`)
- `scripts/check-secrets.sh` — required
- SBOM upload — required
- `pnpm audit --audit-level high` — required
- Trivy filesystem scan — required

---

## Accessibility verification

| Check                | Implementation                                                                |
| -------------------- | ----------------------------------------------------------------------------- |
| WCAG 2.2 AA axe tags | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`       |
| Violation threshold  | All actionable violations fail (not only critical/serious)                    |
| Keyboard navigation  | Login, send flow, transfer detail, German login (`e2e/a11y-keyboard.spec.ts`) |
| German a11y          | German landing + login axe; German keyboard login                             |
| Playwright stability | `workers: 1`, `retries: 0`, `fullyParallel: false`                            |

---

## Mobile verification

| Check                   | Result                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Offline verification    | **PASS** — `scripts/test-mobile-offline.sh` (2026-06-21)                   |
| RN unit tests           | **19 passed** — components, hooks, i18n, send draft storage                |
| Maestro flows           | 5 YAML flows validated; device run **ENVIRONMENT_PENDING** (beta OS / RAM) |
| iOS Simulator           | Blocked locally — Xcode iOS 26.5 vs simulator iOS 17.0; use CI/stable Mac  |
| Android Emulator        | Not configured on this machine                                             |
| Biometrics / deep links | Unit-tested hooks; sandbox-only                                            |

---

## Financial safety (unchanged)

- Money as `bigint` minor units; client cannot advance worker-only states
- `LIVE_TRANSFERS_ENABLED=false`
- Confirm/cancel idempotent POSTs with empty body covered by integration tests
- Webhook deduplication and signature verification covered by integration tests

---

## Portfolio statement

**Ready** for sandbox portfolio demo of **customer web** (fully E2E-tested in CI) and **native mobile** (offline + unit-test verified; device E2E when hardware allows).

**Not ready** for production deployment, real-money transfers, app store release, or regulatory presentation.
