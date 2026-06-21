-- Phase 5 operational readiness

CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "roles" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "transfer_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "assignee_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transfer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "flags" TEXT[],
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "compliance_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reconciliation_runs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "exception_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reconciliation_exceptions" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount_delta" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reconciliation_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_failures" (
    "id" TEXT NOT NULL,
    "provider_event_id" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'sandbox',
    "event_type" TEXT NOT NULL,
    "transfer_id" TEXT,
    "payload" JSONB NOT NULL,
    "failure_reason" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "webhook_failures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refund_proposals" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposed_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refund_proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feature_flag_records" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feature_flag_records_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "privacy_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_transfer_id_idx" ON "support_tickets"("transfer_id");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");
CREATE INDEX "compliance_reviews_user_id_idx" ON "compliance_reviews"("user_id");
CREATE INDEX "compliance_reviews_status_idx" ON "compliance_reviews"("status");
CREATE INDEX "reconciliation_exceptions_run_id_idx" ON "reconciliation_exceptions"("run_id");
CREATE INDEX "reconciliation_exceptions_transfer_id_idx" ON "reconciliation_exceptions"("transfer_id");
CREATE INDEX "webhook_failures_transfer_id_idx" ON "webhook_failures"("transfer_id");
CREATE INDEX "webhook_failures_resolved_idx" ON "webhook_failures"("resolved");
CREATE INDEX "refund_proposals_transfer_id_idx" ON "refund_proposals"("transfer_id");
CREATE INDEX "refund_proposals_status_idx" ON "refund_proposals"("status");
CREATE INDEX "privacy_requests_user_id_idx" ON "privacy_requests"("user_id");
CREATE INDEX "privacy_requests_status_idx" ON "privacy_requests"("status");

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_reviews" ADD CONSTRAINT "compliance_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_reviews" ADD CONSTRAINT "compliance_reviews_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "compliance_reviews" ADD CONSTRAINT "compliance_reviews_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reconciliation_exceptions" ADD CONSTRAINT "reconciliation_exceptions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "reconciliation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_proposals" ADD CONSTRAINT "refund_proposals_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_proposals" ADD CONSTRAINT "refund_proposals_proposed_by_id_fkey" FOREIGN KEY ("proposed_by_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_proposals" ADD CONSTRAINT "refund_proposals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sandbox admin users (password: sandbox123)
INSERT INTO "admin_users" ("id", "email", "password_hash", "roles", "active", "created_at", "updated_at") VALUES
('admin_support', 'support@rupeeroute.local', '$2b$10$6p806bRYeCLL8EnhPuiqReGfvuaMIMFZEwHAxmMHTpDBtf5PoSFzK', ARRAY['support'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin_compliance', 'compliance@rupeeroute.local', '$2b$10$6p806bRYeCLL8EnhPuiqReGfvuaMIMFZEwHAxmMHTpDBtf5PoSFzK', ARRAY['compliance'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin_finance', 'finance@rupeeroute.local', '$2b$10$6p806bRYeCLL8EnhPuiqReGfvuaMIMFZEwHAxmMHTpDBtf5PoSFzK', ARRAY['finance'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin_administrator', 'admin@rupeeroute.local', '$2b$10$6p806bRYeCLL8EnhPuiqReGfvuaMIMFZEwHAxmMHTpDBtf5PoSFzK', ARRAY['administrator'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin_auditor', 'auditor@rupeeroute.local', '$2b$10$6p806bRYeCLL8EnhPuiqReGfvuaMIMFZEwHAxmMHTpDBtf5PoSFzK', ARRAY['auditor'], true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "feature_flag_records" ("key", "enabled", "description", "updated_at") VALUES
('transfer_creation', true, 'Allow new transfer drafts', CURRENT_TIMESTAMP),
('funding_method', true, 'Enable funding initiation', CURRENT_TIMESTAMP),
('payout_method', true, 'Enable payout processing', CURRENT_TIMESTAMP),
('provider_sandbox', true, 'Use sandbox providers', CURRENT_TIMESTAMP),
('coupons', true, 'Enable coupon application', CURRENT_TIMESTAMP);
