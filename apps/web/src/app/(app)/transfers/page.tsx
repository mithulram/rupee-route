'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { TransferSummary } from '@rupeeroute/api-contracts';
import { customerApi } from '@rupeeroute/api-contracts';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui-states';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatMoney } from '../../../lib/format';
import { useT } from '../../../lib/i18n';

export default function TransfersPage() {
  const t = useT();
  const [items, setItems] = useState<TransferSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setItems(await customerApi.listTransfers());
      } catch (err) {
        if (!navigator.onLine) {
          setOffline(true);
          const cached = localStorage.getItem('rr_transfers_cache');
          if (cached) setItems(JSON.parse(cached) as TransferSummary[]);
        }
        setError(err instanceof Error ? err.message : t.common.error);
      } finally {
        setLoading(false);
      }
    })();
  }, [t.common.error]);

  useEffect(() => {
    if (items.length) localStorage.setItem('rr_transfers_cache', JSON.stringify(items));
  }, [items]);

  if (loading) return <LoadingState />;
  if (error && items.length === 0)
    return (
      <ErrorState
        message={error}
        retryLabel={t.common.retry}
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="container">
      <h1>{t.transfers.title}</h1>
      {offline ? (
        <p className="muted" role="status">
          {t.common.offline}
        </p>
      ) : null}
      {items.length === 0 ? (
        <EmptyState message={t.transfers.empty} />
      ) : (
        <ul className="list card">
          {items.map((tx) => (
            <li key={tx.id}>
              <Link href={`/transfers/${tx.id}`} className="list-row">
                <StatusBadge state={tx.state} />
                <span>
                  {tx.sourceAmountMinor && tx.sourceCurrency
                    ? formatMoney(tx.sourceAmountMinor, tx.sourceCurrency)
                    : tx.id}
                </span>
                {tx.recipientName ? <span className="muted">{tx.recipientName}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
