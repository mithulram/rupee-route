'use client';

import { useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { StatusBadge } from '../../../components/status-badge';
import { useAuth } from '../../../hooks/use-auth';
import { useAsyncData } from '../../../hooks/use-async-data';
import { createPrivacyRequest, listPrivacyRequests } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { canDecideCompliance } from '../../../lib/rbac';

export default function PrivacyRequestsPage() {
  const { roles } = useAuth();
  const canCreate = canDecideCompliance(roles);
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<'export' | 'delete'>('export');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useAsyncData(() => listPrivacyRequests());

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    try {
      await createPrivacyRequest({ userId, type });
      setUserId('');
      reload();
    } catch {
      setActionError('Unable to create privacy request.');
    }
  }

  return (
    <div>
      <PageHeader title="Privacy requests" description="GDPR export and deletion requests" />
      {canCreate ? (
        <form className="card filter-bar" onSubmit={(e) => void handleCreate(e)}>
          <div>
            <label htmlFor="privacy-user">User ID</label>
            <input
              id="privacy-user"
              required
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="privacy-type">Type</label>
            <select
              id="privacy-type"
              value={type}
              onChange={(e) => {
                setType(e.target.value as 'export' | 'delete');
              }}
            >
              <option value="export">Export</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <button type="submit" className="button">
            Submit request
          </button>
        </form>
      ) : null}
      {actionError ? (
        <p role="alert" className="error">
          {actionError}
        </p>
      ) : null}
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="No privacy requests" />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">Requested</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((request) => (
              <tr key={request.id}>
                <td>{request.userEmail}</td>
                <td>{request.type}</td>
                <td>
                  <StatusBadge value={request.status} />
                </td>
                <td>{formatDateTime(request.requestedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
