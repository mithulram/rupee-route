# Sandbox deployment — RupeeRoute

**Sandbox only.** `LIVE_TRANSFERS_ENABLED=false` is required on every service. No live payment rails, no admin console on the public internet.

## Architecture

| Component                    | Platform            | Public URL                           |
| ---------------------------- | ------------------- | ------------------------------------ |
| Customer web (`apps/web`)    | **Vercel**          | `https://<project>.vercel.app`       |
| Nest API (`apps/api`)        | **Render** (Docker) | `https://<api-service>.onrender.com` |
| Worker (`apps/worker`)       | **Render** (Docker) | Internal only (health on `:3002`)    |
| PostgreSQL                   | Render managed      | Private connection string            |
| Redis                        | Render managed      | Private connection string            |
| Admin console (`apps/admin`) | **Not deployed**    | Local / VPN only                     |

Deploy order:

1. **Backend** (Render blueprint) — Postgres, Redis, API, worker
2. **Set `WEB_CORS_ORIGINS`** on API to your Vercel HTTPS origin(s)
3. **Vercel web** — set `NEXT_PUBLIC_API_URL` to the Render API HTTPS URL
4. **Smoke tests** — `bash scripts/deploy-smoke.sh`

## Prerequisites

### Vercel (customer web)

- Account: https://vercel.com (authenticated CLI: `vercel whoami`)
- GitHub repo connected for Preview (PR) + Production (`main`) deploys

### Render (API + worker + Postgres + Redis)

- Account: https://render.com
- Blueprint deploy from `render.yaml` in repo root
- **Required access:** Render dashboard or API key to create services

No Render/Railway/Fly credentials were available in this environment — backend deploy stops at blueprint preparation until you connect Render.

## 1. Deploy backend (Render)

1. Push this repo to GitHub (`mithulram/rupee-route`).
2. In Render: **New → Blueprint** → connect repo → apply `render.yaml`.
3. After deploy, copy the API URL (e.g. `https://rupeeroute-api.onrender.com`).
4. In Render API service → Environment:
   - Confirm `LIVE_TRANSFERS_ENABLED=false`
   - Set `WEB_CORS_ORIGINS` to your Vercel URL(s), comma-separated HTTPS only, e.g.  
     `https://rupee-route-web.vercel.app,https://rupee-route-web-*.vercel.app`  
     (Preview URLs: add each preview origin or use a pattern your host supports)

Verify health:

```bash
curl -sS "https://<api-host>/health" | jq .
# Expect: liveTransfersEnabled=false, sandboxMode=true
```

## 2. Deploy customer web (Vercel)

From repo root:

```bash
cd apps/web
vercel link          # create/link project rupee-route-web
vercel git connect   # GitHub → Preview on PR, Production on main
```

Set environment variables (**names only** — set values in Vercel dashboard):

| Variable                     | Production           | Preview             | Notes                      |
| ---------------------------- | -------------------- | ------------------- | -------------------------- |
| `NEXT_PUBLIC_API_URL`        | Render API HTTPS URL | Same or preview API | **Never** `localhost`      |
| `NEXT_PUBLIC_SANDBOX_BANNER` | `true`               | `true`              | Always show sandbox banner |

Do **not** deploy production until `NEXT_PUBLIC_API_URL` points to the live sandbox API.

```bash
# After env vars are set:
vercel --prod   # production from main only
```

## 3. Post-deploy smoke tests

```bash
export WEB_URL="https://rupee-route-web.vercel.app"
export API_URL="https://rupeeroute-api.onrender.com"
bash scripts/deploy-smoke.sh
```

Checks: API health, `liveTransfersEnabled=false`, web landing, login page.

Full transfer flow (register → send → funding) requires manual or Playwright against deployed URLs.

## Environment variable reference (sandbox)

### API (Render)

| Name                         | Required   | Example purpose        |
| ---------------------------- | ---------- | ---------------------- |
| `LIVE_TRANSFERS_ENABLED`     | yes        | Must be `false`        |
| `SANDBOX_FORCE_KYC_APPROVED` | yes        | `true` for demo KYC    |
| `DATABASE_URL`               | yes        | From Render Postgres   |
| `REDIS_URL`                  | yes        | From Render Redis      |
| `JWT_SECRET`                 | yes        | Generated in Render    |
| `WEBHOOK_SIGNING_SECRET`     | yes        | Generated in Render    |
| `WEB_CORS_ORIGINS`           | yes (prod) | HTTPS Vercel origin(s) |
| `NODE_ENV`                   | yes        | `production`           |

### Worker (Render)

| Name                     | Required      |
| ------------------------ | ------------- |
| `LIVE_TRANSFERS_ENABLED` | `false`       |
| `DATABASE_URL`           | from Postgres |
| `REDIS_URL`              | from Redis    |
| `WEBHOOK_SIGNING_SECRET` | same as API   |

### Web (Vercel)

| Name                         | Required      |
| ---------------------------- | ------------- |
| `NEXT_PUBLIC_API_URL`        | HTTPS API URL |
| `NEXT_PUBLIC_SANDBOX_BANNER` | `true`        |

## Blockers checklist

| Blocker                 | Resolution                                                 |
| ----------------------- | ---------------------------------------------------------- |
| No Render account       | Sign up at render.com, apply blueprint                     |
| No Vercel ↔ GitHub link | `vercel git connect` in `apps/web`                         |
| API URL unset on Vercel | Deploy Render first, then set env                          |
| CORS errors             | Set `WEB_CORS_ORIGINS` on API to exact Vercel HTTPS origin |
| Free Render spin-down   | First request after idle may take ~30s                     |

## What we do not deploy

- Admin console (`apps/admin`)
- Live payment / KYC / FX / payout provider credentials
- `LIVE_TRANSFERS_ENABLED=true`
