'use client';

import Link from 'next/link';
import { EmptyState } from '../../../../components/empty-state';
import { ErrorState } from '../../../../components/error-state';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { StatusBadge } from '../../../../components/status-badge';
import { useAsyncData } from '../../../../hooks/use-async-data';
import { listReconciliationExceptions } from '../../../../lib/api';
import { formatDateTime, truncateId } from '../../../../lib/format';

export default function ReconciliationExceptionsPage() {
  const { data, error, isLoading, reload } = useAsyncData(() => listReconciliationExceptions());

  return (
    <div>
      <PageHeader
        title="Reconciliation exceptions"
        description="Unresolved ledger mismatches"
        actions={
          <Link href="/reconciliation" className="button button-secondary">
            Back to runs
          </Link>
        }
      />
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="No exceptions" description="All reconciliation runs are clean." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Transfer</th>
              <th scope="col">Type</th>
              <th scope="col">Delta</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/transfers/${item.transferId}`}>{truncateId(item.transferId)}</Link>
                </td>
                <td>{item.type}</td>
                <td>{item.amountDelta}</td>
                <td>
                  <StatusBadge value={item.status} />
                </td>
                <td>{formatDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
