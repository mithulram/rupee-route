import { describe, expect, it } from 'vitest';
import {
  applyTransition,
  nextStateAfterWebhook,
  mapFundingReceivedNext,
  mapFxBookedNext,
  mapPayoutFailedNext,
} from './orchestrator.js';
import type { TransferState } from './state-machine.js';
import {
  buildFundingJournal,
  buildFxBookedJournal,
  buildPayoutJournal,
  buildRefundJournal,
  validateJournal,
} from '../ledger/journal.js';

const PAYOUT_FAILED_SEQUENCE = [
  { eventType: 'funding.received' },
  { eventType: 'screening.cleared' },
  { eventType: 'payout.processing' },
  { eventType: 'payout.failed' },
  { eventType: 'refund.completed' },
] as const;

function applyWebhook(current: TransferState, eventType: string): TransferState | null {
  const next = nextStateAfterWebhook(current, eventType);
  if (!next) return null;
  applyTransition({ from: current, to: next, actor: 'webhook' });
  return next;
}

function walkWebhookSequence(
  initial: TransferState,
  events: { eventType: string }[],
): TransferState {
  let current = initial;
  for (const step of events) {
    const next = applyWebhook(current, step.eventType);
    if (next) {
      current = next;
      if (next === 'funding_received') {
        current = applyTransition({
          from: current,
          to: mapFundingReceivedNext(),
          actor: 'worker',
        });
      }
      if (next === 'fx_booked') {
        current = applyTransition({
          from: current,
          to: mapFxBookedNext(),
          actor: 'worker',
        });
      }
      if (next === 'payout_failed') {
        current = applyTransition({
          from: current,
          to: mapPayoutFailedNext(),
          actor: 'worker',
        });
      }
    }
  }
  return current;
}

function requireWebhook(current: TransferState, eventType: string): TransferState {
  const next = applyWebhook(current, eventType);
  if (!next) {
    throw new Error(`Expected webhook ${eventType} from ${current}`);
  }
  return next;
}

describe('sandbox transfer flows', () => {
  it('executes happy path to delivered', () => {
    let state: TransferState = 'funding_pending';
    state = requireWebhook(state, 'funding.received');
    state = applyTransition({ from: state, to: mapFundingReceivedNext(), actor: 'worker' });
    state = applyTransition({ from: state, to: 'fx_booked', actor: 'webhook' });
    state = applyTransition({ from: state, to: mapFxBookedNext(), actor: 'worker' });
    state = requireWebhook(state, 'payout.processing');
    state = requireWebhook(state, 'payout.delivered');
    expect(state).toBe('delivered');
  });

  it('handles funding failure terminal state', () => {
    const state = applyWebhook('funding_pending', 'funding.failed');
    expect(state).toBe('funding_failed');
  });

  it('handles compliance hold via screening decline', () => {
    let state: TransferState = 'funding_pending';
    state = requireWebhook(state, 'funding.received');
    state = applyTransition({ from: state, to: mapFundingReceivedNext(), actor: 'worker' });
    state = requireWebhook(state, 'screening.declined');
    expect(state).toBe('compliance_declined');
  });

  it('handles payout failure and refund', () => {
    const final = walkWebhookSequence('funding_pending', [...PAYOUT_FAILED_SEQUENCE]);
    expect(final).toBe('refunded');
  });

  it('ignores out-of-order webhook (payout before funding)', () => {
    const next = nextStateAfterWebhook('funding_pending', 'payout.delivered');
    expect(next).toBeNull();
  });

  it('posts balanced ledger journals across lifecycle', () => {
    const source = 10000n;
    const target = 900000n;
    const margin = 75n;
    for (const journal of [
      buildFundingJournal({
        journalId: 'j1',
        transferId: 't1',
        idempotencyKey: 'k1',
        sourceAmountMinor: source,
        sourceCurrency: 'EUR',
      }),
      buildFxBookedJournal({
        journalId: 'j2',
        transferId: 't1',
        idempotencyKey: 'k2',
        sourceAmountMinor: source,
        sourceCurrency: 'EUR',
        targetAmountMinor: target,
        marginMinor: margin,
      }),
      buildPayoutJournal({
        journalId: 'j3',
        transferId: 't1',
        idempotencyKey: 'k3',
        targetAmountMinor: target,
      }),
      buildRefundJournal({
        journalId: 'j4',
        transferId: 't1',
        idempotencyKey: 'k4',
        sourceAmountMinor: source,
        sourceCurrency: 'EUR',
      }),
    ]) {
      expect(() => validateJournal(journal)).not.toThrow();
    }
  });
});
