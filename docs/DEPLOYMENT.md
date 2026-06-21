# Sandbox deployment — RupeeRoute

**Sandbox only.** `LIVE_TRANSFERS_ENABLED=false` is required on every service. No live payment rails, no admin console on the public internet.

## Architecture

| Component                         | Platform                    | Public URL                               |
| --------------------------------- | --------------------------- | ---------------------------------------- |
| Customer web (`apps/web`)         | **Vercel**                  | `https://<project>.vercel.app`           |
| Nest API (`apps/api`)             | **Render** (Docker)         | `https://<api-service>.onrender.com`     |
| Embedded sandbox worker           | **Inside API container**    | BullMQ consumer on `:3002` (health only) |
| Standalone worker (`apps/worker`) | **Not on Render free plan** | Use for paid/production hosting          |
| PostgreSQL                        | Render managed              | Private connection string                |
| Redis                             | Render managed              | Private connection string                |
| Admin console (`apps/admin`)      | **Not deployed**            | Local / VPN only                         |

### Free Render sandbox mode

Render’s free plan does **not** support a separate always-on `type: worker` service. Sandbox deployments use **combined-worker mode**:

- `SANDBOX_COMBINED_WORKER=true` on the API service
- `infra/docker/start-sandbox-api.sh` runs migrations, starts the existing worker process in the background, then starts the API in the foreground
- `WORKER_PORT=3002` for the embedded worker health endpoint (internal only)
- SIGTERM shuts down both processes cleanly

The standalone worker Dockerfile (`infra/docker/Dockerfile.worker`) and `apps/worker` package are unchanged for future paid/production hosting where API and worker run as separate services.

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

## Prerequisites

### Vercel (customer web)

- Account: https://vercel.com
- GitHub repo connected for Preview (PR) + Production (`main`) deploys

### Render (API + Postgres + Redis)

- Account: https://render.com
- Blueprint deploy from `render.yaml` in repo root
- All services in the **same region** (Oregon in the current blueprint) so internal `connectionString` URLs work

## 1. Deploy backend (Render)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → connect repo → apply `render.yaml`.
3. After deploy, copy the API URL (e.g. `https://rupeeroute-api.onrender.com`).
4. In Render API service → Environment, confirm:
   - `LIVE_TRANSFERS_ENABLED=false`
   - `SANDBOX_COMBINED_WORKER=true`
   - `WORKER_PORT=3002`
   - `WEB_CORS_ORIGINS` set to your Vercel HTTPS origin(s)

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
```

Smoke checks cover API health and web landing/login/register. Full transfer flow (register → quote → confirm → funding → tracking) requires the embedded worker and Redis.

## Environment variable reference (sandbox)

### API (Render — includes embedded worker when `SANDBOX_COMBINED_WORKER=true`)

| Name                         | Required   | Example purpose        |
| ---------------------------- | ---------- | ---------------------- |
| `LIVE_TRANSFERS_ENABLED`     | yes        | Must be `false`        |
| `SANDBOX_COMBINED_WORKER`    | yes (free) | `true` — embed worker  |
| `WORKER_PORT`                | yes (free) | `3002`                 |
| `SANDBOX_FORCE_KYC_APPROVED` | yes        | `true` for demo KYC    |
| `DATABASE_URL`               | yes        | From Render Postgres   |
| `REDIS_URL`                  | yes        | From Render Redis      |
| `JWT_SECRET`                 | yes        | Generated in Render    |
| `WEBHOOK_SIGNING_SECRET`     | yes        | Generated in Render    |
| `WEB_CORS_ORIGINS`           | yes (prod) | HTTPS Vercel origin(s) |
| `NODE_ENV`                   | yes        | `production`           |

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

| Blocker                      | Resolution                                                 |
| ---------------------------- | ---------------------------------------------------------- |
| API/Postgres region mismatch | Keep all blueprint services in the same region             |
| Worker jobs not processing   | Confirm `SANDBOX_COMBINED_WORKER=true` and Redis reachable |
| CORS errors                  | Set `WEB_CORS_ORIGINS` on API to exact Vercel HTTPS origin |
| Free Render spin-down        | First request after idle may take ~30s                     |

## What we do not deploy

- Admin console (`apps/admin`)
- Separate Render `type: worker` on the free plan
- Live payment / KYC / FX / payout provider credentials
- `LIVE_TRANSFERS_ENABLED=true`
