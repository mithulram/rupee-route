'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RecipientResponse } from '@rupeeroute/api-contracts';
import { customerApi } from '@rupeeroute/api-contracts';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui-states';
import { useT } from '../../../lib/i18n';

export default function RecipientsPage() {
  const t = useT();
  const [items, setItems] = useState<RecipientResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void customerApi
      .listRecipients()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t.common.error))
      .finally(() => setLoading(false));
  }, [t.common.error]);

  if (loading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => window.location.reload()}
        retryLabel={t.common.retry}
      />
    );

  return (
    <div className="container">
      <header className="page-header">
        <h1>{t.recipients.title}</h1>
        <Link href="/recipients/new" className="button">
          {t.recipients.new}
        </Link>
      </header>
      {items.length === 0 ? (
        <EmptyState message={t.recipients.empty} />
      ) : (
        <ul className="list card">
          {items.map((r) => (
            <li key={r.id}>
              <strong>{r.displayName}</strong>
              <span className="muted"> — {r.type === 'upi' ? r.upiId : r.accountNumber}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
