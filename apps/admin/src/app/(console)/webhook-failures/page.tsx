'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { useAuth } from '../../../hooks/use-auth';
import { useAsyncData } from '../../../hooks/use-async-data';
import { listWebhookFailures, retryWebhookFailure } from '../../../lib/api';
import { formatDateTime, truncateId } from '../../../lib/format';
import { canManageFinance } from '../../../lib/rbac';

export default function WebhookFailuresPage() {
  const { roles } = useAuth();
  const canRetry = canManageFinance(roles);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useAsyncData(() => listWebhookFailures());

  async function handleRetry(id: string) {
    setActionError(null);
    try {
      await retryWebhookFailure(id);
      reload();
    } catch {
      setActionError('Unable to retry webhook.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Webhook failures"
        description="Failed provider webhooks and payout notifications"
      />
      {actionError ? (
        <p role="alert" className="error">
          {actionError}
        </p>
      ) : null}
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="No failures" description="All webhooks processed successfully." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Event</th>
              <th scope="col">Transfer</th>
              <th scope="col">Reason</th>
              <th scope="col">Retries</th>
              <th scope="col">Last attempt</th>
              {canRetry ? <th scope="col">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.items.map((failure) => (
              <tr key={failure.id}>
                <td>{failure.provider}</td>
                <td>{failure.eventType}</td>
                <td>
                  {failure.transferId ? (
                    <Link href={`/transfers/${failure.transferId}`}>
                      {truncateId(failure.transferId)}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{failure.failureReason}</td>
                <td>{failure.retryCount}</td>
                <td>{formatDateTime(failure.lastAttemptAt)}</td>
                {canRetry ? (
                  <td>
                    <button
                      type="button"
                      className="button button-small button-secondary"
                      onClick={() => void handleRetry(failure.id)}
                    >
                      Retry
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
