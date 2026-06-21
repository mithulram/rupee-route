# RupeeRoute — Provider Integration Guide

Last updated: **2026-06-20**

## Overview

RupeeRoute integrates external providers for KYC, FX quoting, funding, screening, India payout, and notifications. In sandbox mode, all providers are **deterministic mocks** in `@rupeeroute/provider-sdk`.

**Live provider integration is not enabled in this build.**

---

## Provider abstractions

| Provider      | Interface              | Sandbox implementation                        |
| ------------- | ---------------------- | --------------------------------------------- |
| FX Quote      | `FxQuoteProvider`      | EUR/CHF→INR mid rates with disclosed margin   |
| KYC           | `KycProvider`          | Hash-based status (approved/pending/rejected) |
| Screening     | `ScreeningProvider`    | Scenario-based cleared/held                   |
| Funding       | `FundingProvider`      | Scenario-based pending/failed                 |
| Payout        | `PayoutProvider`       | Scenario-based processing/failed              |
| Notifications | `NotificationProvider` | Always delivered (sandbox)                    |

Location: `packages/provider-sdk/src/sandbox/deterministic.ts`

---

## Webhook contract

Providers POST signed webhooks to:

```
POST /api/v1/webhooks/provider
Header: x-webhook-signature (HMAC-SHA256 hex)
```

Payload shape (`ProviderWebhookPayload`):

```json
{
  "eventId": "unique-event-id",
  "eventType": "funding.received",
  "transferId": "transfer-id",
  "correlationId": "uuid",
  "occurredAt": "ISO-8601"
}
```

Event types: `funding.received`, `funding.failed`, `screening.cleared`, `screening.declined`, `payout.processing`, `payout.delivered`, `payout.failed`, `refund.completed`

Processing flow:

1. API verifies signature and stores `WebhookEvent`
2. Job enqueued to BullMQ (`webhooks` queue) with 3 retry attempts
3. Worker `TransferProcessor` applies state transition, posts ledger, auto-advances

---

## Sandbox scenarios

Override scenario per transfer via deterministic hash or explicit override:

| Scenario          | Behavior                                     |
| ----------------- | -------------------------------------------- |
| `happy_path`      | Full success through delivered               |
| `funding_failed`  | Funding fails at initiation                  |
| `compliance_hold` | Screening returns held → compliance_declined |
| `payout_failed`   | Payout fails → refund path                   |

Webhook sequences: `packages/provider-sdk/src/webhook/simulator.ts`

---

## Signing webhooks (development)

```typescript
import { signWebhookPayload, buildWebhookPayload } from '@rupeeroute/provider-sdk';

const payload = buildWebhookPayload(
  { eventType: 'funding.received' },
  transferId,
  correlationId,
  0,
);
const signature = signWebhookPayload(payload, process.env.WEBHOOK_SIGNING_SECRET);
```

---

## Moving to live providers

Prerequisites before replacing sandbox adapters:

1. Licensed payment service provider agreements (DE/CH send, IN receive)
2. Legal and compliance sign-off (see `PILOT_READINESS.md`)
3. Security review of credential storage (Vault/KMS, not env files)
4. Production webhook endpoints with mTLS or IP allowlisting
5. Reconciliation against real provider settlement files
6. Set `LIVE_TRANSFERS_ENABLED=true` only after all approvals — **currently blocked at startup**

Integration pattern:

1. Implement provider interface in `packages/provider-sdk/src/live/`
2. Select implementation via feature flag `provider_sandbox` kill switch
3. Add provider-specific webhook signature verification
4. Extend reconciliation to ingest provider settlement CSV/API

---

## Provider status monitoring

Admin console **Providers** page shows health from `createMonitoringSnapshot()`:

- FX, KYC, Funding, Payout, Screening, Notifications
- Status: `healthy`, `degraded`, `down`
- Based on recent webhook failure count and queue depth

---

## Error handling

| Failure                 | System response                                          |
| ----------------------- | -------------------------------------------------------- |
| Invalid signature       | 401 Unauthorized                                         |
| Duplicate event         | Acknowledged, not reprocessed                            |
| Out-of-order event      | Marked processed, no state change                        |
| Processing failure (3x) | Dead-letter in `webhook_failures`; admin retry available |

---

## Testing provider flows

```bash
# Start stack
docker compose -f infra/docker-compose.yml up -d
pnpm db:migrate
pnpm dev

# Simulate signed webhook (from monorepo root)
curl -X POST http://localhost:3001/api/v1/webhooks/provider \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: <computed-sig>" \
  -d '{"eventId":"test_1","eventType":"funding.received","transferId":"<id>","correlationId":"<uuid>","occurredAt":"2026-06-20T12:00:00Z"}'
```

See `TEST_STRATEGY.md` for automated webhook and E2E coverage.
