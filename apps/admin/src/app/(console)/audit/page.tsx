'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { useAuth } from '../../../hooks/use-auth';
import { useAsyncData } from '../../../hooks/use-async-data';
import { exportAuditEvents, listAuditEvents } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { canExportAudit, isReadOnly } from '../../../lib/rbac';

export default function AuditPage() {
  const { roles } = useAuth();
  const readOnly = isReadOnly(roles);
  const canExport = canExportAudit(roles);

  const [resourceType, setResourceType] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ resourceType, resourceId, from, to }),
    [resourceType, resourceId, from, to],
  );

  const { data, error, isLoading, reload } = useAsyncData(
    () => listAuditEvents(filters),
    `${filters.resourceType}|${filters.resourceId}|${filters.from}|${filters.to}`,
  );

  async function handleExport() {
    setExportError(null);
    try {
      const csv = await exportAuditEvents(filters);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Export failed. Auditor role required.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Audit events"
        description={
          readOnly
            ? 'Read-only audit log with export access'
            : 'Append-only audit trail — never modified or deleted'
        }
        actions={
          canExport ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void handleExport()}
            >
              Export CSV
            </button>
          ) : undefined
        }
      />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          reload();
        }}
        aria-label="Filter audit events"
      >
        <div>
          <label htmlFor="audit-resource-type">Resource type</label>
          <input
            id="audit-resource-type"
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="audit-resource-id">Resource ID</label>
          <input
            id="audit-resource-id"
            value={resourceId}
            onChange={(e) => {
              setResourceId(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="audit-from">From</label>
          <input
            id="audit-from"
            type="datetime-local"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="audit-to">To</label>
          <input
            id="audit-to"
            type="datetime-local"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
            }}
          />
        </div>
        <button type="submit" className="button button-secondary">
          Apply
        </button>
      </form>
      {exportError ? (
        <p role="alert" className="error">
          {exportError}
        </p>
      ) : null}
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="No audit events" description="Adjust filters or widen the date range." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Resource</th>
              <th scope="col">Actor</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((event) => (
              <tr key={event.id}>
                <td>{event.action}</td>
                <td>
                  {event.resourceType}:{event.resourceId}
                </td>
                <td>{event.actorEmail ?? 'system'}</td>
                <td>{formatDateTime(event.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
