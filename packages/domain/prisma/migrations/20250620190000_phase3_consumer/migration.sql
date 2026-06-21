-- Phase 3 consumer preferences and support tickets
ALTER TABLE "users" ADD COLUMN "preferred_language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "users" ADD COLUMN "notification_email" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "quotes" ADD COLUMN "coupon_code" TEXT;

CREATE TABLE "customer_support_tickets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "transfer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_support_tickets_user_id_idx" ON "customer_support_tickets"("user_id");
CREATE INDEX "customer_support_tickets_status_idx" ON "customer_support_tickets"("status");

ALTER TABLE "customer_support_tickets" ADD CONSTRAINT "customer_support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_support_tickets" ADD CONSTRAINT "customer_support_tickets_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
