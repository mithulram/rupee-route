'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { StatusBadge } from '../../../components/status-badge';
import { useAuth } from '../../../hooks/use-auth';
import { useAsyncData } from '../../../hooks/use-async-data';
import { listReconciliationRuns, triggerReconciliationRun } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { canManageFinance } from '../../../lib/rbac';

export default function ReconciliationPage() {
  const { roles } = useAuth();
  const canTrigger = canManageFinance(roles);
  const [actionError, setActionError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const { data, error, isLoading, reload } = useAsyncData(() => listReconciliationRuns());

  async function handleTrigger() {
    setActionError(null);
    setTriggering(true);
    try {
      await triggerReconciliationRun();
      reload();
    } catch {
      setActionError('Unable to trigger reconciliation run.');
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        description="Ledger reconciliation runs and exceptions"
        actions={
          <>
            <Link href="/reconciliation/exceptions" className="button button-secondary">
              View exceptions
            </Link>
            {canTrigger ? (
              <button
                type="button"
                className="button"
                disabled={triggering}
                onClick={() => void handleTrigger()}
              >
                {triggering ? 'Triggering…' : 'Trigger run'}
              </button>
            ) : null}
          </>
        }
      />
      {actionError ? (
        <p role="alert" className="error">
          {actionError}
        </p>
      ) : null}
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="No runs yet" description="Trigger a reconciliation run to begin." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Run ID</th>
              <th scope="col">Status</th>
              <th scope="col">Started</th>
              <th scope="col">Completed</th>
              <th scope="col">Exceptions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>
                  <StatusBadge value={run.status} />
                </td>
                <td>{formatDateTime(run.startedAt)}</td>
                <td>{run.completedAt ? formatDateTime(run.completedAt) : '—'}</td>
                <td>{run.exceptionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
