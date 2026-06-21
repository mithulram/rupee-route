import type { ProviderWebhookPayload, SandboxScenario, WebhookEventType } from '../types.js';
import { signWebhookPayload } from '../webhook/signature.js';

export interface WebhookSequenceStep {
  eventType: WebhookEventType;
  delayMs?: number;
}

const HAPPY_PATH: WebhookSequenceStep[] = [
  { eventType: 'funding.received' },
  { eventType: 'screening.cleared' },
  { eventType: 'payout.processing' },
  { eventType: 'payout.delivered' },
];

const FUNDING_FAILED: WebhookSequenceStep[] = [{ eventType: 'funding.failed' }];

const COMPLIANCE_HOLD: WebhookSequenceStep[] = [
  { eventType: 'funding.received' },
  { eventType: 'screening.declined' },
];

const PAYOUT_FAILED: WebhookSequenceStep[] = [
  { eventType: 'funding.received' },
  { eventType: 'screening.cleared' },
  { eventType: 'payout.processing' },
  { eventType: 'payout.failed' },
  { eventType: 'refund.completed' },
];

export function webhookSequenceForScenario(scenario: SandboxScenario): WebhookSequenceStep[] {
  switch (scenario) {
    case 'funding_failed':
      return FUNDING_FAILED;
    case 'compliance_hold':
      return COMPLIANCE_HOLD;
    case 'payout_failed':
    case 'refund':
      return PAYOUT_FAILED;
    default:
      return HAPPY_PATH;
  }
}

export function buildWebhookPayload(
  step: WebhookSequenceStep,
  transferId: string,
  correlationId: string,
  eventIndex: number,
): ProviderWebhookPayload {
  return {
    eventId: `${transferId}_${step.eventType}_${String(eventIndex)}`,
    eventType: step.eventType,
    transferId,
    correlationId,
    occurredAt: new Date().toISOString(),
  };
}

export function simulateSignedWebhook(
  payload: ProviderWebhookPayload,
  secret: string,
): { payload: ProviderWebhookPayload; signature: string; body: string } {
  const body = JSON.stringify(payload);
  const signature = signWebhookPayload(payload, secret);
  return { payload, signature, body };
}
