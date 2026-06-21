import { describe, expect, it } from 'vitest';
import { canTransition } from '@rupeeroute/domain';

describe('API transfer security rules', () => {
  it('client cannot mark transfer funded', () => {
    expect(canTransition('funding_pending', 'funding_received', 'client')).toBe(false);
  });

  it('client cannot mark transfer delivered', () => {
    expect(canTransition('payout_processing', 'delivered', 'client')).toBe(false);
  });

  it('client cannot mark payout processing', () => {
    expect(canTransition('payout_pending', 'payout_processing', 'client')).toBe(false);
  });

  it('webhook can mark funding received', () => {
    expect(canTransition('funding_pending', 'funding_received', 'webhook')).toBe(true);
  });
});
