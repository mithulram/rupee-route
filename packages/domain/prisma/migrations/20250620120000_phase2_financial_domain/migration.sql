-- AlterTable
ALTER TABLE "users" ADD COLUMN "kyc_status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "ifsc" TEXT,
    "account_number" TEXT,
    "upi_id" TEXT,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_currency" VARCHAR(3) NOT NULL,
    "target_currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "source_amount_minor" BIGINT NOT NULL,
    "target_amount_minor" BIGINT NOT NULL,
    "mid_rate" TEXT NOT NULL,
    "customer_rate" TEXT NOT NULL,
    "margin_bps" INTEGER NOT NULL,
    "margin_percent" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "recipient_id" TEXT,
    "state" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_state_history" (
    "id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "from_state" TEXT,
    "to_state" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "journal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "transfer_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount_minor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "description" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "transfer_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipients_user_id_idx" ON "recipients"("user_id");

-- CreateIndex
CREATE INDEX "quotes_user_id_idx" ON "quotes"("user_id");

-- CreateIndex
CREATE INDEX "quotes_expires_at_idx" ON "quotes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_quote_id_key" ON "transfers"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_idempotency_key_key" ON "transfers"("idempotency_key");

-- CreateIndex
CREATE INDEX "transfers_user_id_idx" ON "transfers"("user_id");

-- CreateIndex
CREATE INDEX "transfers_state_idx" ON "transfers"("state");

-- CreateIndex
CREATE INDEX "transfers_correlation_id_idx" ON "transfers"("correlation_id");

-- CreateIndex
CREATE INDEX "transfer_state_history_transfer_id_idx" ON "transfer_state_history"("transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_code_key" ON "ledger_accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_idempotency_key_account_id_direction_key" ON "ledger_entries"("idempotency_key", "account_id", "direction");

-- CreateIndex
CREATE INDEX "ledger_entries_transfer_id_idx" ON "ledger_entries"("transfer_id");

-- CreateIndex
CREATE INDEX "ledger_entries_journal_id_idx" ON "ledger_entries"("journal_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider_event_id");

-- CreateIndex
CREATE INDEX "webhook_events_transfer_id_idx" ON "webhook_events"("transfer_id");

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_state_history" ADD CONSTRAINT "transfer_state_history_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed ledger accounts
INSERT INTO "ledger_accounts" ("id", "code", "name", "currency") VALUES
  ('acct_customer_funding', 'SANDBOX_CUSTOMER_FUNDING', 'Sandbox Customer Funding', 'EUR'),
  ('acct_fx_clearing_eur', 'SANDBOX_FX_CLEARING_EUR', 'Sandbox FX Clearing EUR', 'EUR'),
  ('acct_fx_clearing_chf', 'SANDBOX_FX_CLEARING_CHF', 'Sandbox FX Clearing CHF', 'CHF'),
  ('acct_fx_out_eur', 'SANDBOX_FX_OUT_EUR', 'Sandbox FX Out EUR', 'EUR'),
  ('acct_fx_out_chf', 'SANDBOX_FX_OUT_CHF', 'Sandbox FX Out CHF', 'CHF'),
  ('acct_fx_in_inr', 'SANDBOX_FX_IN_INR', 'Sandbox FX In INR', 'INR'),
  ('acct_inr_payout', 'SANDBOX_INR_PAYOUT_CLEARING', 'Sandbox INR Payout Clearing', 'INR'),
  ('acct_fx_margin', 'FX_MARGIN_REVENUE', 'FX Margin Revenue', 'EUR'),
  ('acct_provider', 'SANDBOX_PROVIDER_SETTLEMENT', 'Sandbox Provider Settlement', 'INR');
