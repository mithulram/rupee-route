import type { Money } from '@rupeeroute/domain';

export interface ProviderContext {
  correlationId: string;
  idempotencyKey: string;
}

export type KycStatus = 'approved' | 'pending' | 'rejected';
export type ScreeningStatus = 'cleared' | 'held' | 'declined';
export type FundingStatus = 'received' | 'failed' | 'pending';
export type PayoutStatus = 'processing' | 'delivered' | 'failed';

export interface FxQuoteRequest {
  sourceCurrency: Money['currency'];
  targetCurrency: Money['currency'];
  sourceAmountMinor: bigint;
}

export interface FxQuoteResponse {
  midRate: string;
  customerRate: string;
  marginBps: number;
  targetAmountMinor: bigint;
}

export interface FxQuoteProvider {
  getQuote(request: FxQuoteRequest): Promise<FxQuoteResponse>;
}

export interface KycProvider {
  checkStatus(userId: string, context: ProviderContext): Promise<{ status: KycStatus }>;
  submitVerification(userId: string, context: ProviderContext): Promise<{ status: KycStatus }>;
}

export interface ScreeningProvider {
  screenTransfer(
    transferId: string,
    context: ProviderContext,
  ): Promise<{ status: ScreeningStatus }>;
}

export interface FundingProvider {
  initiateFunding(
    transferId: string,
    amount: Money,
    context: ProviderContext,
  ): Promise<{ reference: string; status: FundingStatus }>;
}

export interface PayoutProvider {
  initiatePayout(
    recipientId: string,
    amount: Money,
    context: ProviderContext,
  ): Promise<{ reference: string; status: PayoutStatus }>;
}

export interface NotificationProvider {
  notify(
    userId: string,
    event: string,
    payload: Record<string, unknown>,
    context: ProviderContext,
  ): Promise<{ delivered: boolean }>;
}

export type SandboxScenario =
  | 'happy_path'
  | 'funding_failed'
  | 'compliance_hold'
  | 'payout_failed'
  | 'refund';

export interface SandboxProviderBundle {
  fxQuote: FxQuoteProvider;
  kyc: KycProvider;
  screening: ScreeningProvider;
  funding: FundingProvider;
  payout: PayoutProvider;
  notifications: NotificationProvider;
}

export type WebhookEventType =
  | 'kyc.updated'
  | 'funding.received'
  | 'funding.failed'
  | 'screening.cleared'
  | 'screening.declined'
  | 'payout.processing'
  | 'payout.delivered'
  | 'payout.failed'
  | 'refund.completed';

export interface ProviderWebhookPayload {
  eventId: string;
  eventType: WebhookEventType;
  transferId: string;
  correlationId: string;
  occurredAt: string;
  data?: Record<string, unknown>;
}
