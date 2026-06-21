# Sandbox deployment — RupeeRoute

**Sandbox only.** `LIVE_TRANSFERS_ENABLED=false` is required on every service. No live payment rails, no admin console on the public internet.

## Architecture

| Component                         | Platform                    | Public URL                               |
| --------------------------------- | --------------------------- | ---------------------------------------- |
| Customer web (`apps/web`)         | **Vercel**                  | `https://<project>.vercel.app`           |
| Nest API (`apps/api`)             | **Render** (Docker)         | `https://<api-service>.onrender.com`     |
| Embedded sandbox worker           | **Inside API container**    | BullMQ consumer on `:3002` (health only) |
| Standalone worker (`apps/worker`) | **Not on Render free plan** | Use for paid/production hosting          |
| PostgreSQL                        | Render managed (Oregon)     | Connection string                        |
| Redis                             | Render managed (Oregon)     | Connection string                        |
| Admin console (`apps/admin`)      | **Not deployed**            | Local / VPN only                         |

### Cross-region constraint (Frankfurt API — current production)

The live sandbox API (`rupeeroute-api`) runs in **Frankfurt**. Postgres and Redis are in **Oregon**. Render does not support changing a web service’s region in place.

Because internal `connectionString` URLs only work within the same region, the Frankfurt API uses **manually managed external** `DATABASE_URL` and `REDIS_URL` values (Oregon external connection strings from the Render Dashboard). These are set on the service in Render and are **not** declared in `render.yaml`, so Blueprint sync cannot overwrite them with broken internal URLs.

| Setting        | Blueprint (`render.yaml`) | Live Frankfurt API       |
| -------------- | ------------------------- | ------------------------ |
| `DATABASE_URL` | Omitted (preserved)       | External Oregon Postgres |
| `REDIS_URL`    | Omitted (preserved)       | External Oregon Redis    |
| API region     | Not set (existing svc)    | Frankfurt                |
| PG / Redis     | Oregon                    | Oregon                   |

**Future fix:** colocate API in Oregon — see [MIGRATION-OREGON-API.md](./MIGRATION-OREGON-API.md).

### Blueprint sync and omitted environment variables

Per [Render Blueprint docs](https://render.com/docs/blueprint-spec#setting-environment-variables):

> A Blueprint can create new environment variables or modify the values of existing ones. **Render preserves existing environment variables, even if you omit them from the Blueprint file.**

Implications for this project:

- Removing `DATABASE_URL` / `REDIS_URL` from `render.yaml` does **not** delete them on the live service; Manual Sync should leave the manually set external values in place.
- Env vars **defined** in the Blueprint **are** updated on sync (e.g. `WEB_CORS_ORIGINS`, `SANDBOX_COMBINED_WORKER`).
- `sync: false` secrets are only prompted on **initial** Blueprint creation; omitted generated secrets (`JWT_SECRET`, `WEBHOOK_SIGNING_SECRET`) remain unless explicitly redefined.

Auto Sync is enabled on the Blueprint; pushing `render.yaml` changes applies safe fields without requiring Manual Sync for the cross-region URLs.

### Free Render sandbox mode

Render’s free plan does **not** support a separate always-on `type: worker` service. Sandbox deployments use **combined-worker mode**:

- `SANDBOX_COMBINED_WORKER=true` on the API service
- `infra/docker/start-sandbox-api.sh` runs migrations, starts the existing worker process in the background, then starts the API in the foreground
- `WORKER_PORT=3002` for the embedded worker health endpoint (internal only)
- SIGTERM shuts down both processes cleanly

The standalone worker Dockerfile (`infra/docker/Dockerfile.worker`) and `apps/worker` package are unchanged for future paid/production hosting where API and worker run as separate services.

### Redis IP allowlist (cross-region)

Render Key Value (Redis) **requires** an `ipAllowList`. Internal-only (`[]`) works when API and Redis share a region. For the Frankfurt API using an **external** Redis URL, connections arrive from public egress IPs, so the allowlist must include `0.0.0.0/0`.

- **Auth:** Redis remains password-protected via the connection string; the allowlist only controls which IPs may attempt a connection.
- **Live config:** `rupeeroute-redis` → `ipAllowList: [{ cidrBlock: "0.0.0.0/0", description: "sandbox-external-api" }]`
- **Blueprint:** `render.yaml` documents the same allowlist so sync does not revert to internal-only (`[]`).
- **After Oregon migration:** tighten to `ipAllowList: []` when API is colocated — see [MIGRATION-OREGON-API.md](./MIGRATION-OREGON-API.md).

### Production / real-money hosting

Real-money production requires:

- A **separate always-on worker** service (not embedded)
- `SANDBOX_COMBINED_WORKER` unset or `false` on the API
- `LIVE_TRANSFERS_ENABLED=false` until regulatory authorization and live provider credentials are in place — **never enable live transfers in this repository’s sandbox deployment**

Deploy order:

1. **Backend** (Render blueprint) — Postgres, Redis, API with embedded worker
2. **Set `WEB_CORS_ORIGINS`** on API to your Vercel HTTPS origin(s)
3. **Vercel web** — set `NEXT_PUBLIC_API_URL` to the Render API HTTPS URL
4. **Smoke tests** — `bash scripts/deploy-smoke.sh`
5. **Transfer flow** — confirm → funding webhook → tracking (requires Redis + embedded worker)
6. **Restart resilience (optional)** — `RESTART=true bash scripts/deploy-post-restart-smoke.sh`

## Prerequisites

### Vercel (customer web)

- Account: https://vercel.com
- GitHub repo connected for Preview (PR) + Production (`main`) deploys

### Render (API + Postgres + Redis)

- Account: https://render.com
- Blueprint deploy from `render.yaml` in repo root
- **Greenfield:** all services in the same region (Oregon) so internal `connectionString` URLs work
- **Current sandbox:** Frankfurt API + Oregon data stores — external URLs managed in Dashboard (see above)

## 1. Deploy backend (Render)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → connect repo → apply `render.yaml`.
3. After deploy, copy the API URL (e.g. `https://rupeeroute-api.onrender.com`).
4. In Render API service → Environment, confirm:
   - `LIVE_TRANSFERS_ENABLED=false`
   - `SANDBOX_COMBINED_WORKER=true`
   - `WORKER_PORT=3002`
   - `WEB_CORS_ORIGINS` set to your Vercel HTTPS origin(s)
   - **Cross-region only:** `DATABASE_URL` and `REDIS_URL` set to Oregon **external** connection strings (from Postgres/Redis Dashboard → Connect → External)

Verify health:

```bash
curl -sS "https://<api-host>/health" | jq .
# Expect: liveTransfersEnabled=false, sandboxMode=true
```

## 2. Deploy customer web (Vercel)

From repo root:

```bash
cd apps/web
vercel link
vercel git connect
```

| Variable                     | Production           | Preview             | Notes                      |
| ---------------------------- | -------------------- | ------------------- | -------------------------- |
| `NEXT_PUBLIC_API_URL`        | Render API HTTPS URL | Same or preview API | **Never** `localhost`      |
| `NEXT_PUBLIC_SANDBOX_BANNER` | `true`               | `true`              | Always show sandbox banner |

## 3. Post-deploy smoke tests

```bash
export WEB_URL="https://rupee-route-web.vercel.app"
export API_URL="https://rupeeroute-api.onrender.com"
bash scripts/deploy-smoke.sh
bash scripts/deploy-transfer-smoke.sh
```

Full transfer smoke covers register → confirm → signed `funding.received` webhook → poll until `funding_received` (validates embedded worker + Redis).

### Restart-safe verification (CI / post-deploy)

```bash
export WEB_URL="https://rupee-route-web.vercel.app"
export API_URL="https://rupeeroute-api.onrender.com"
# Optional: restart API before smokes (Render CLI must be authenticated)
RESTART=true bash scripts/deploy-post-restart-smoke.sh
```

Set `RESTART=false` (default) to skip restart and only run health wait + smokes.

## Environment variable reference (sandbox)

### API (Render — includes embedded worker when `SANDBOX_COMBINED_WORKER=true`)

| Name                         | Required   | Example purpose                            |
| ---------------------------- | ---------- | ------------------------------------------ |
| `LIVE_TRANSFERS_ENABLED`     | yes        | Must be `false`                            |
| `SANDBOX_COMBINED_WORKER`    | yes (free) | `true` — embed worker                      |
| `WORKER_PORT`                | yes (free) | `3002`                                     |
| `SANDBOX_FORCE_KYC_APPROVED` | yes        | `true` for demo KYC                        |
| `DATABASE_URL`               | yes        | Render Postgres (external if cross-region) |
| `REDIS_URL`                  | yes        | Render Redis (external if cross-region)    |
| `JWT_SECRET`                 | yes        | Generated in Render                        |
| `WEBHOOK_SIGNING_SECRET`     | yes        | Generated in Render                        |
| `WEB_CORS_ORIGINS`           | yes (prod) | HTTPS Vercel origin(s)                     |
| `NODE_ENV`                   | yes        | `production`                               |

### Standalone worker (paid / production only)

| Name                     | Required      |
| ------------------------ | ------------- |
| `LIVE_TRANSFERS_ENABLED` | `false`       |
| `DATABASE_URL`           | from Postgres |
| `REDIS_URL`              | from Redis    |
| `WEBHOOK_SIGNING_SECRET` | same as API   |
| `WORKER_PORT`            | `3002`        |

Set `SANDBOX_COMBINED_WORKER=false` (or omit) on the API when using a separate worker service.

### Web (Vercel)

| Name                         | Required      |
| ---------------------------- | ------------- |
| `NEXT_PUBLIC_API_URL`        | HTTPS API URL |
| `NEXT_PUBLIC_SANDBOX_BANNER` | `true`        |

## Blockers checklist

| Blocker                      | Resolution                                                               |
| ---------------------------- | ------------------------------------------------------------------------ |
| API/Postgres region mismatch | External `DATABASE_URL`/`REDIS_URL` (Frankfurt) or migrate to Oregon API |
| Redis allowlist errors       | External cross-region needs `0.0.0.0/0`; auth via connection string      |
| Worker jobs not processing   | Confirm `SANDBOX_COMBINED_WORKER=true` and Redis reachable               |
| Blueprint overwrote DB URLs  | Omit `DATABASE_URL`/`REDIS_URL` from yaml; restore external strings      |
| CORS errors                  | Set `WEB_CORS_ORIGINS` on API to exact Vercel HTTPS origin               |
| Free Render spin-down        | First request after idle may take ~30s                                   |

## What we do not deploy

- Admin console (`apps/admin`)
- Separate Render `type: worker` on the free plan
- Live payment / KYC / FX / payout provider credentials
- `LIVE_TRANSFERS_ENABLED=true`

## Related docs

- [MIGRATION-OREGON-API.md](./MIGRATION-OREGON-API.md) — plan to colocate API in Oregon (prepared, not executed)
