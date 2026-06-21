import { describe, expect, it } from 'vitest';
import {
  signWebhookPayload,
  verifyWebhookSignature,
  buildWebhookPayload,
  webhookSequenceForScenario,
} from '@rupeeroute/provider-sdk';

describe('webhook signature', () => {
  it('signs and verifies payload', () => {
    const payload = buildWebhookPayload({ eventType: 'funding.received' }, 'tr_1', 'corr_1', 0);
    const sig = signWebhookPayload(payload, 'test-secret');
    expect(verifyWebhookSignature(payload, sig, 'test-secret')).toBe(true);
    expect(verifyWebhookSignature(payload, 'bad', 'test-secret')).toBe(false);
  });

  it('provides payout failure sequence with refund', () => {
    const seq = webhookSequenceForScenario('payout_failed');
    expect(seq.some((s) => s.eventType === 'payout.failed')).toBe(true);
    expect(seq.some((s) => s.eventType === 'refund.completed')).toBe(true);
  });
});
