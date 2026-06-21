# Oregon API migration plan (prepared — not executed)

This document describes how to colocate the sandbox API with Postgres and Redis in **Oregon**, eliminating cross-region external connection strings and Redis `0.0.0.0/0` allowlisting.

**Render cannot move an existing web service from Frankfurt to Oregon in place.** Migration requires creating a new Oregon API service, validating it, switching the Vercel frontend, then decommissioning Frankfurt only after explicit approval.

## Current state (Frankfurt API)

| Resource              | Region    | Notes                                            |
| --------------------- | --------- | ------------------------------------------------ |
| `rupeeroute-api`      | Frankfurt | Uses **external** `DATABASE_URL` / `REDIS_URL`   |
| `rupeeroute-postgres` | Oregon    | Internal connection strings work in Oregon only  |
| `rupeeroute-redis`    | Oregon    | `ipAllowList: 0.0.0.0/0` for cross-region access |

## Target state (Oregon API)

| Resource              | Region | Notes                                        |
| --------------------- | ------ | -------------------------------------------- |
| `rupeeroute-api`      | Oregon | Internal `fromDatabase` / `fromService` URLs |
| `rupeeroute-postgres` | Oregon | Unchanged                                    |
| `rupeeroute-redis`    | Oregon | `ipAllowList: []` (internal-only)            |

## Prerequisites

- [ ] Explicit user approval to proceed with migration
- [ ] `LIVE_TRANSFERS_ENABLED=false` on all services (unchanged)
- [ ] Backup / export of any Frankfurt-only env overrides documented

## Step 1 — Add Oregon API to Blueprint (do not delete Frankfurt yet)

In `render.yaml`, add a **new** web service (e.g. `rupeeroute-api-oregon`) with:

```yaml
- type: web
  name: rupeeroute-api-oregon
  runtime: docker
  plan: free
  region: oregon
  dockerfilePath: ./infra/docker/Dockerfile.api
  dockerContext: .
  healthCheckPath: /health
  autoDeploy: true
  envVars:
    - key: NODE_ENV
      value: production
    - key: LOG_LEVEL
      value: info
    - key: LIVE_TRANSFERS_ENABLED
      value: 'false'
    - key: SANDBOX_FORCE_KYC_APPROVED
      value: 'true'
    - key: SANDBOX_COMBINED_WORKER
      value: 'true'
    - key: WORKER_PORT
      value: '3002'
    - key: DATABASE_URL
      fromDatabase:
        name: rupeeroute-postgres
        property: connectionString
    - key: REDIS_URL
      fromService:
        type: redis
        name: rupeeroute-redis
        property: connectionString
    - key: JWT_SECRET
      generateValue: true
    - key: WEBHOOK_SIGNING_SECRET
      generateValue: true
    - key: WEB_CORS_ORIGINS
      value: https://rupee-route-web.vercel.app
```

Copy `JWT_SECRET` and `WEBHOOK_SIGNING_SECRET` from the Frankfurt service if you need webhook continuity during cutover (or accept new secrets and update any external webhook configs).

## Step 2 — Deploy Oregon API

1. Merge blueprint change and let auto-sync create `rupeeroute-api-oregon`, **or** create the service manually in Render with the same Docker image and env vars.
2. Note the new URL (e.g. `https://rupeeroute-api-oregon.onrender.com`).

## Step 3 — Validate Oregon API

```bash
export API_URL="https://<oregon-api-host>.onrender.com"
export WEB_URL="https://rupee-route-web.vercel.app"
bash scripts/deploy-smoke.sh
bash scripts/deploy-transfer-smoke.sh
# Optional restart resilience check:
RESTART=true bash scripts/deploy-post-restart-smoke.sh
```

Confirm:

- [ ] `/health` returns `sandboxMode: true`, `liveTransfersEnabled: false`
- [ ] CORS works from Vercel origin (`WEB_CORS_ORIGINS`)
- [ ] Transfer flow reaches `funding_received` (embedded worker + internal Redis)
- [ ] No Redis allowlist errors in Oregon API logs

## Step 4 — Tighten Redis allowlist (after Oregon API validated)

Once only Oregon services connect internally:

1. Set Redis `ipAllowList` to `[]` (internal-only) in Render Dashboard or `render.yaml`.
2. Re-run transfer smoke against Oregon API to confirm worker still processes jobs.

Frankfurt API will stop working against internal-only Redis — expected during cutover.

## Step 5 — Switch Vercel frontend

In Vercel project settings for `apps/web`:

| Variable              | New value            |
| --------------------- | -------------------- |
| `NEXT_PUBLIC_API_URL` | Oregon API HTTPS URL |

Redeploy web (production + preview as needed). Smoke the live customer flow in the browser.

## Step 6 — Decommission Frankfurt API (requires explicit approval)

**Do not delete `rupeeroute-api` (Frankfurt) until the user explicitly approves.**

After approval:

1. Confirm Oregon API handles all traffic (logs, smokes, Vercel).
2. Delete or suspend the Frankfurt web service only — **do not** delete Postgres or Redis.
3. Optionally rename `rupeeroute-api-oregon` → `rupeeroute-api` in a follow-up (Render service names/URLs are tied to creation; renaming may require custom domain or accepting a new default URL).

## Rollback

If Oregon API fails after Vercel cutover:

1. Revert `NEXT_PUBLIC_API_URL` to Frankfurt API URL.
2. Redeploy Vercel.
3. Frankfurt API remains until explicitly deleted.

## What this migration does not change

- Postgres and Redis instances (same Oregon resources)
- `LIVE_TRANSFERS_ENABLED=false`
- Embedded sandbox worker mode (`SANDBOX_COMBINED_WORKER=true`)
- Vercel hosting for customer web
