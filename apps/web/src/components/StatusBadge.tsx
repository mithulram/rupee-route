const LABELS: Record<string, string> = {
  draft: 'Draft',
  quote_created: 'Quote created',
  recipient_validated: 'Recipient validated',
  identity_required: 'Identity required',
  compliance_review: 'Compliance review',
  funding_pending: 'Awaiting funding',
  funding_received: 'Funding received',
  payout_pending: 'Payout in progress',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  compliance_declined: 'Declined',
  funding_failed: 'Funding failed',
  payout_failed: 'Payout failed',
};

export function StatusBadge({ state }: { state: string }) {
  const label = LABELS[state] ?? state.replaceAll('_', ' ');
  const tone =
    state.includes('failed') || state === 'compliance_declined'
      ? 'error'
      : state === 'delivered'
        ? 'success'
        : 'default';
  return (
    <span className={`status-badge status-${tone}`} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
