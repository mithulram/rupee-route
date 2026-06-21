import { describe, expect, it } from 'vitest';
import { applyTransition, nextStateAfterWebhook } from './orchestrator.js';
import { assertTransition, canTransition } from './state-machine.js';

describe('transfer state machine', () => {
  it('allows client draft → quote_created', () => {
    expect(canTransition('draft', 'quote_created', 'client')).toBe(true);
  });

  it('rejects client funding_received transition', () => {
    expect(() =>
      applyTransition({ from: 'funding_pending', to: 'funding_received', actor: 'client' }),
    ).toThrow(/Client cannot transition/);
  });

  it('rejects invalid transition', () => {
    expect(() =>
      applyTransition({ from: 'draft', to: 'funding_pending', actor: 'client' }),
    ).toThrow(/Invalid transfer transition/);
  });

  it('allows worker funding webhook transition', () => {
    expect(canTransition('funding_pending', 'funding_received', 'webhook')).toBe(true);
    const next = nextStateAfterWebhook('funding_pending', 'funding.received');
    expect(next).toBe('funding_received');
  });

  it('maps payout failure to refund path via worker', () => {
    expect(canTransition('payout_processing', 'payout_failed', 'webhook')).toBe(true);
    expect(canTransition('payout_failed', 'refund_pending', 'worker')).toBe(true);
    expect(nextStateAfterWebhook('payout_processing', 'payout.failed')).toBe('payout_failed');
    expect(nextStateAfterWebhook('refund_pending', 'refund.completed')).toBe('refunded');
  });

  it('blocks transitions from terminal states', () => {
    expect(() => applyTransition({ from: 'delivered', to: 'refunded', actor: 'worker' })).toThrow(
      /terminal state/,
    );
  });

  it('rejects direct client path to delivered', () => {
    expect(assertTransition).toBeDefined();
    expect(canTransition('payout_processing', 'delivered', 'client')).toBe(false);
  });
});
