export const TRANSFER_STATES = [
  'draft',
  'quote_created',
  'recipient_validated',
  'identity_required',
  'compliance_review',
  'funding_pending',
  'funding_received',
  'screening_pending',
  'fx_booked',
  'payout_pending',
  'payout_processing',
  'delivered',
  'quote_expired',
  'cancelled',
  'funding_failed',
  'compliance_declined',
  'payout_failed',
  'refund_pending',
  'refunded',
  'reversed',
] as const;

export type TransferState = (typeof TRANSFER_STATES)[number];

export const TERMINAL_STATES: readonly TransferState[] = [
  'delivered',
  'quote_expired',
  'cancelled',
  'funding_failed',
  'compliance_declined',
  'refunded',
  'reversed',
];

export const WORKER_ONLY_TARGET_STATES: readonly TransferState[] = [
  'funding_received',
  'screening_pending',
  'fx_booked',
  'payout_pending',
  'payout_processing',
  'delivered',
  'funding_failed',
  'compliance_declined',
  'payout_failed',
  'refund_pending',
  'refunded',
  'reversed',
  'quote_expired',
];

export type TransitionActor = 'client' | 'worker' | 'webhook';

const TRANSITIONS: Record<TransferState, Partial<Record<TransferState, TransitionActor[]>>> = {
  draft: { quote_created: ['client'] },
  quote_created: {
    recipient_validated: ['client'],
    quote_expired: ['worker', 'webhook'],
    cancelled: ['client'],
  },
  recipient_validated: {
    identity_required: ['client'],
    compliance_review: ['client', 'worker'],
    cancelled: ['client'],
  },
  identity_required: {
    compliance_review: ['worker', 'webhook'],
    compliance_declined: ['worker', 'webhook'],
    cancelled: ['client'],
  },
  compliance_review: {
    funding_pending: ['client'],
    compliance_declined: ['worker', 'webhook'],
    cancelled: ['client'],
  },
  funding_pending: {
    funding_received: ['worker', 'webhook'],
    funding_failed: ['worker', 'webhook'],
    cancelled: ['client'],
  },
  funding_received: { screening_pending: ['worker'] },
  screening_pending: {
    fx_booked: ['worker', 'webhook'],
    compliance_declined: ['worker', 'webhook'],
  },
  fx_booked: { payout_pending: ['worker'] },
  payout_pending: { payout_processing: ['worker', 'webhook'] },
  payout_processing: {
    delivered: ['worker', 'webhook'],
    payout_failed: ['worker', 'webhook'],
  },
  payout_failed: { refund_pending: ['worker'] },
  refund_pending: { refunded: ['worker', 'webhook'] },
  quote_expired: {},
  cancelled: {},
  funding_failed: {},
  compliance_declined: {},
  delivered: {},
  refunded: {},
  reversed: {},
};

export function isTerminalState(state: TransferState): boolean {
  return (TERMINAL_STATES as readonly string[]).includes(state);
}

export function canTransition(
  from: TransferState,
  to: TransferState,
  actor: TransitionActor,
): boolean {
  const allowed = TRANSITIONS[from][to];
  return allowed?.includes(actor) ?? false;
}

export function assertTransition(
  from: TransferState,
  to: TransferState,
  actor: TransitionActor,
): void {
  if (!canTransition(from, to, actor)) {
    throw new Error(`Invalid transfer transition: ${from} → ${to} by ${actor}`);
  }
}

export function assertClientCannotAdvanceFinancialState(to: TransferState): void {
  if ((WORKER_ONLY_TARGET_STATES as readonly string[]).includes(to)) {
    throw new Error(`Client cannot transition transfer to ${to}`);
  }
}
