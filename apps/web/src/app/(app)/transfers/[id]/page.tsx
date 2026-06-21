'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { TransferDetail } from '@rupeeroute/api-contracts';
import { customerApi, newIdempotencyKey } from '@rupeeroute/api-contracts';
import { TransferTimeline } from '../../../../components/TransferTimeline';
import { StatusBadge } from '../../../../components/StatusBadge';
import { ErrorState, LoadingState } from '../../../../components/ui-states';
import { formatMoney } from '../../../../lib/format';
import { useT } from '../../../../lib/i18n';

export default function TransferDetailPage() {
  const params = useParams<{ id: string }>();
  const t = useT();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransfer(await customerApi.getTransfer(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [params.id, t.common.error]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);

  async function cancel() {
    if (!transfer || !window.confirm(t.transfers.cancelConfirm)) return;
    await customerApi.cancelTransfer(transfer.id, newIdempotencyKey());
    await load();
  }

  if (loading && !transfer) return <LoadingState />;
  if (error && !transfer)
    return <ErrorState message={error} onRetry={() => void load()} retryLabel={t.common.retry} />;
  if (!transfer) return null;

  const canCancel = !['delivered', 'cancelled', 'refunded'].includes(transfer.state);

  return (
    <div className="container narrow">
      <h1>{t.transfers.detail}</h1>
      <StatusBadge state={transfer.state} />
      {transfer.quote ? (
        <section className="card" aria-labelledby="receipt-heading">
          <h2 id="receipt-heading">{t.transfers.receipt}</h2>
          <dl className="quote-summary">
            <div>
              <dt>{t.transfers.sendLabel}</dt>
              <dd>
                {formatMoney(transfer.quote.sourceAmountMinor, transfer.quote.sourceCurrency)}
              </dd>
            </div>
            <div>
              <dt>{t.transfers.deliverLabel}</dt>
              <dd>{formatMoney(transfer.quote.targetAmountMinor, 'INR')}</dd>
            </div>
            <div>
              <dt>{t.transfers.rateLabel}</dt>
              <dd>{transfer.quote.customerRate}</dd>
            </div>
            <div>
              <dt>{t.transfers.marginLabel}</dt>
              <dd>{transfer.quote.marginDisclosure}</dd>
            </div>
          </dl>
        </section>
      ) : null}
      {transfer.failureReason ? (
        <p className="error" role="alert">
          {transfer.failureReason}
        </p>
      ) : null}
      <section className="card">
        <h2>{t.transfers.timeline}</h2>
        <TransferTimeline history={transfer.stateHistory} />
      </section>
      {canCancel ? (
        <button type="button" className="button button-secondary" onClick={() => void cancel()}>
          {t.transfers.cancel}
        </button>
      ) : null}
    </div>
  );
}
