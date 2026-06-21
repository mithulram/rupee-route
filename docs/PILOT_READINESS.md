# RupeeRoute — Pilot Readiness Checklist

Last updated: **2026-06-20**

## Critical statement

**Live transfers remain disabled until legal, compliance, security, operations, and licensed-provider approvals are complete.**

The sandbox build enforces this at startup: `LIVE_TRANSFERS_ENABLED=true` causes the API and worker to refuse boot (`assertSandboxMode`).

---

## Current readiness (sandbox)

| Area                             | Status   | Evidence                                          |
| -------------------------------- | -------- | ------------------------------------------------- |
| Financial domain & state machine | Complete | Phase 2 — 53+ domain/API tests                    |
| Admin console with RBAC          | Complete | Phase 5 — role-gated console at port 3003         |
| Immutable audit trail            | Complete | Append-only `audit_events`; admin actor logging   |
| Support tickets                  | Complete | CRUD with transfer context                        |
| Reconciliation                   | Complete | Simulated mismatch detection                      |
| Webhook DLQ & retry              | Complete | 3-attempt backoff + admin retry                   |
| Refund workflow                  | Complete | Proposal → approval → state transition            |
| Feature flag kill switches       | Complete | 5 runtime flags + env live-transfer gate          |
| Security hardening               | Complete | Helmet, throttler, CORS, secret scan, SBOM, Trivy |
| Operations runbook               | Complete | `OPERATIONS_RUNBOOK.md`                           |

---

## Pilot gate checklist (all required before live)

### Legal

- [ ] Terms of service and privacy policy reviewed by counsel (DE/CH/IN jurisdictions)
- [ ] Remittance license or partner-bank arrangement documented
- [ ] Marketing copy approved (no "instant" or "free" claims)
- [ ] Data processing agreements with providers executed

### Compliance

- [ ] AML/KYC program documented and approved
- [ ] Transaction monitoring rules calibrated for production volumes
- [ ] SAR/STR escalation procedures defined
- [ ] Compliance review queue staffed and trained

### Security

- [ ] Penetration test completed and findings remediated
- [ ] Secrets in KMS/Vault (not `.env` files in production)
- [ ] CSP and security headers validated in production deployment
- [ ] Dependency and container scanning in CI (green)
- [ ] PII redaction verified in production log pipeline
- [ ] RBAC authorization tests passing

### Operations

- [ ] On-call rotation defined
- [ ] Runbook exercised in tabletop drill
- [ ] Reconciliation against live provider settlement files validated
- [ ] Webhook failure alerting wired to PagerDuty/Opsgenie
- [ ] Backup and restore tested for Postgres

### Licensed providers

- [ ] FX liquidity provider contracted and certified
- [ ] Funding/payment provider live credentials provisioned
- [ ] India payout partner onboarded (NEFT/IMPS/UPI rails)
- [ ] KYC provider production API keys and webhook URLs configured
- [ ] Provider SLAs documented

### Technical

- [ ] `LIVE_TRANSFERS_ENABLED=true` approved by steering committee
- [ ] Live provider adapters implemented (replace sandbox)
- [ ] End-to-end pilot with internal users (small amounts)
- [ ] Rollback plan: kill switches tested under load
- [ ] Customer web and mobile apps pass full E2E + accessibility suites

---

## Sandbox pilot (available now)

Internal teams can execute full sandbox transfers:

1. Register consumer at http://localhost:3000
2. Create quote → recipient → confirm transfer
3. Simulate provider webhooks to advance states
4. Investigate via admin console without database access
5. Run reconciliation to detect simulated mismatches

---

## Sign-off matrix

| Function    | Approver | Date | Signature |
| ----------- | -------- | ---- | --------- |
| Legal       |          |      |           |
| Compliance  |          |      |           |
| Security    |          |      |           |
| Operations  |          |      |           |
| Engineering |          |      |           |
| Product     |          |      |           |

---

## Rollback procedure

If issues arise after live enablement:

1. Administrator disables `transfer_creation` kill switch (immediate)
2. Disable `funding_method` and `payout_method` if funds in flight
3. Set `LIVE_TRANSFERS_ENABLED=false` and redeploy (requires engineering)
4. Notify customers via status page
5. Post-incident review within 48 hours

---

## Contact

Sandbox engineering: monorepo maintainers  
Production pilot: _TBD — assign before go-live_
