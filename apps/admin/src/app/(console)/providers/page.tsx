'use client';

import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { StatusBadge } from '../../../components/status-badge';
import { useAsyncData } from '../../../hooks/use-async-data';
import { listProviderStatus } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';

export default function ProvidersPage() {
  const { data, error, isLoading, reload } = useAsyncData(() => listProviderStatus());

  return (
    <div>
      <PageHeader title="Provider status" description="External payout and FX provider health" />
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.providers.length === 0 ? (
        <EmptyState title="No providers configured" />
      ) : null}
      {!isLoading && !error && data && data.providers.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Status</th>
              <th scope="col">Message</th>
              <th scope="col">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {data.providers.map((provider) => (
              <tr key={provider.id}>
                <td>{provider.name}</td>
                <td>
                  <StatusBadge value={provider.status} />
                </td>
                <td>{provider.message ?? '—'}</td>
                <td>{formatDateTime(provider.lastCheckedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
