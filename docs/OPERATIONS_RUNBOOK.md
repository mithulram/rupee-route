# RupeeRoute — Operations Runbook

Last updated: **2026-06-20**

## Purpose

This runbook guides support, compliance, finance, and engineering staff operating the RupeeRoute **sandbox** environment. All procedures assume **no live money movement**.

---

## Roles and access

| Role          | Console access                                     | Can mutate transfer state?          |
| ------------- | -------------------------------------------------- | ----------------------------------- |
| Support       | Transfers (read), users (read), tickets            | No                                  |
| Compliance    | KYC/txn review queue, privacy requests             | Approve/decline reviews only        |
| Finance       | Reconciliation, refund proposals, webhook failures | Refund approval only (via workflow) |
| Administrator | Feature flags, all read areas                      | Feature flags only                  |
| Auditor       | Audit export, transfers (read)                     | No                                  |

**Sandbox credentials** (password: `sandbox123`):

| Email                       | Role          |
| --------------------------- | ------------- |
| support@rupeeroute.local    | support       |
| compliance@rupeeroute.local | compliance    |
| finance@rupeeroute.local    | finance       |
| admin@rupeeroute.local      | administrator |
| auditor@rupeeroute.local    | auditor       |

Admin console: http://localhost:3003 — API: http://localhost:3001

---

## Investigating a transfer (without database access)

1. Sign in to the admin console as **support** or **administrator**.
2. Navigate to **Transfers** and search by transfer ID, correlation ID, or user ID.
3. Open the transfer detail page:
   - **Timeline** — state history with actor and reason
   - **Ledger** — double-entry lines per journal
   - **Webhooks** — provider events received and processing status
   - **Audit** — all admin and system actions for this transfer
   - **Tickets** — linked support cases
4. To view the customer profile, follow the user link from the transfer row.

Every action taken in the console is recorded in the immutable audit trail.

---

## Support tickets

1. From a transfer detail page or **Tickets**, create a ticket with subject, description, and optional transfer link.
2. Update status: `open` → `in_progress` → `resolved` → `closed`.
3. Assign via assignee email field.
4. Support staff **cannot** change transfer states — escalate to compliance or finance as needed.

---

## Compliance review

1. Sign in as **compliance**.
2. Open **Compliance Reviews** — pending items are auto-created from users with `kycStatus` pending/in_review.
3. Review risk score and flags.
4. **Approve** or **Decline** — decision is auditable and updates user KYC status.
5. Declined users cannot proceed with transfers requiring KYC clearance.

---

## Reconciliation

1. Sign in as **finance**.
2. Navigate to **Reconciliation** → **Run reconciliation**.
3. The sandbox engine compares ledger debits to simulated provider settlement amounts.
4. Review **Exceptions** — types include `amount_delta`, `missing_ledger`, `missing_provider`, `currency_mismatch`.
5. Investigate each exception via linked transfer ID.

---

## Webhook failures and retries

1. Sign in as **finance** or **administrator**.
2. Open **Webhook Failures** — lists dead-letter events after 3 failed processing attempts.
3. Click **Retry** to re-enqueue the webhook to BullMQ.
4. Monitor transfer timeline for state advancement after successful retry.

Worker configuration: 3 attempts, exponential backoff (1s base).

---

## Refund workflow

1. Finance creates a **Refund Proposal** for a transfer in `payout_failed` (or eligible state).
2. Another finance user or administrator **approves** the proposal.
3. Transfer moves to `refund_pending`; sandbox webhook `refund.completed` completes the cycle.
4. All steps are audit-logged.

---

## Feature flag kill switches

Administrator can disable at runtime (DB-backed):

| Flag key            | Effect                          |
| ------------------- | ------------------------------- |
| `transfer_creation` | Blocks new transfer drafts      |
| `funding_method`    | Blocks funding initiation       |
| `payout_method`     | Blocks payout processing        |
| `provider_sandbox`  | Disables sandbox provider calls |
| `coupons`           | Disables coupon application     |

`LIVE_TRANSFERS_ENABLED` remains env-only and must stay `false` in sandbox builds.

---

## Privacy requests

1. Compliance creates **export** or **delete** requests for a user ID.
2. Track status: `pending` → `in_progress` → `completed` / `rejected`.
3. Export: compile user profile, transfers, recipients, audit events (manual in sandbox).
4. Delete: sandbox marks request; production requires legal review before execution.

---

## Monitoring and alerts

Administrator can view **Monitoring Alerts** at `/api/v1/admin/monitoring/alerts`:

- Webhook failure rate threshold
- Open reconciliation exceptions
- BullMQ queue depth

Check **Provider Status** dashboard for sandbox FX, KYC, funding, payout, screening health.

---

## Incident response (sandbox)

| Symptom                              | Action                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| Transfers stuck in `funding_pending` | Check webhook failures; retry or simulate signed webhook             |
| Reconciliation exceptions spike      | Run reconciliation; investigate first transfer in exception list     |
| API 429 responses                    | Rate limit triggered — review throttler config; wait and retry       |
| Admin login fails                    | Verify admin user exists and is active; check JWT_SECRET consistency |

---

## Service ports

| Service  | Port |
| -------- | ---- |
| API      | 3001 |
| Worker   | 3002 |
| Admin    | 3003 |
| Web      | 3000 |
| Postgres | 5432 |
| Redis    | 6379 |

---

## Escalation

Sandbox issues: engineering via GitHub issues.  
Production/pilot issues: follow `PILOT_READINESS.md` approval chain before enabling live transfers.
