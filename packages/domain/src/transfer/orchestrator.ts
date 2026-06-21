import type { TransitionActor, TransferState } from './state-machine.js';
import {
  assertClientCannotAdvanceFinancialState,
  assertTransition,
  isTerminalState,
} from './state-machine.js';

export interface TransitionRequest {
  from: TransferState;
  to: TransferState;
  actor: TransitionActor;
  reason?: string;
}

export function applyTransition(request: TransitionRequest): TransferState {
  if (isTerminalState(request.from)) {
    throw new Error(`Transfer is in terminal state ${request.from}`);
  }

  if (request.actor === 'client') {
    assertClientCannotAdvanceFinancialState(request.to);
  }

  assertTransition(request.from, request.to, request.actor);
  return request.to;
}

export function nextStateAfterWebhook(
  current: TransferState,
  eventType: string,
): TransferState | null {
  const map: Record<string, Partial<Record<TransferState, TransferState>>> = {
    'funding.received': { funding_pending: 'funding_received' },
    'funding.failed': { funding_pending: 'funding_failed' },
    'kyc.updated': { identity_required: 'compliance_review' },
    'screening.cleared': { screening_pending: 'fx_booked' },
    'screening.declined': { screening_pending: 'compliance_declined' },
    'payout.processing': { payout_pending: 'payout_processing' },
    'payout.delivered': { payout_processing: 'delivered' },
    'payout.failed': { payout_processing: 'payout_failed' },
    'refund.completed': { refund_pending: 'refunded' },
  };

  const transitions = map[eventType];
  if (!transitions) return null;
  return transitions[current] ?? null;
}

export function mapFundingReceivedNext(): TransferState {
  return 'screening_pending';
}

export function mapFxBookedNext(): TransferState {
  return 'payout_pending';
}

export function mapPayoutFailedNext(): TransferState {
  return 'refund_pending';
}
