# RupeeRoute — Product Specification (Sandbox)

## Vision

RupeeRoute is a premium **sandbox-to-pilot** remittance product for verified consumers in **Germany (EUR)** and **Switzerland (CHF)** sending to **INR** recipients in India. It demonstrates production-grade fintech patterns without live money movement.

## In scope

- Consumer registration and authentication (DE/CH corridor eligibility)
- Profile and KYC status visibility (sandbox providers)
- FX quotes with **disclosed margin** (no separate transfer fee)
- Transfer lifecycle with explicit states and realistic delivery messaging
- Immutable audit trail and operational double-entry ledger
- Responsive web, native iOS/Android, and internal admin console

## Out of scope

- Live payment credentials or real money movement
- Wallets, stored balances, crypto, cards, cash pickup
- Lending, business transfers, travel booking
- Fabricated regulatory licenses or compliance approvals
- Claims that transfers are guaranteed instant

## Corridors

| Send     | Receive  |
| -------- | -------- |
| DE / EUR | IN / INR |
| CH / CHF | IN / INR |

## Revenue model

Revenue is a **clearly disclosed FX margin** embedded in the customer rate. There is no separate transfer fee line item.

## Personas (sandbox)

1. **Consumer** — verified sender in DE or CH using web or mobile
2. **Operations** — internal user monitoring audit events and transfer health via admin console
3. **Provider (mock)** — deterministic KYC, payment, FX, and payout adapters

## Phase 1 deliverables (foundation)

- Monorepo with API, worker, web, admin, mobile
- Shared domain types, design tokens, OpenAPI contract foundation
- PostgreSQL + Redis via Docker Compose
- Prisma migrations including immutable `audit_events`
- Feature flag `LIVE_TRANSFERS_ENABLED=false` enforced at startup
- Auth routes: register, login, protected `/api/v1/me`
- No transfer creation UI

## Future phases

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for transfer state machine, ledger postings, provider webhooks, and WCAG 2.2 AA transfer flows.
