'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { StatusBadge } from '../../../components/status-badge';
import { useAsyncData } from '../../../hooks/use-async-data';
import { listTransfers } from '../../../lib/api';
import { formatDateTime, truncateId } from '../../../lib/format';

export default function TransfersPage() {
  const [state, setState] = useState('');
  const [userId, setUserId] = useState('');
  const [q, setQ] = useState('');

  const filters = useMemo(() => ({ state, userId, q }), [state, userId, q]);
  const { data, error, isLoading, reload } = useAsyncData(
    () => listTransfers(filters),
    `${filters.state}|${filters.userId}|${filters.q}`,
  );

  return (
    <div>
      <PageHeader title="Transfers" description="Search and inspect sandbox transfer lifecycle" />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          reload();
        }}
        aria-label="Filter transfers"
      >
        <div>
          <label htmlFor="transfer-state">State</label>
          <input
            id="transfer-state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
            }}
            placeholder="e.g. funded"
          />
        </div>
        <div>
          <label htmlFor="transfer-user">User ID</label>
          <input
            id="transfer-user"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="transfer-q">Search</label>
          <input
            id="transfer-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            placeholder="Reference or ID"
          />
        </div>
        <button type="submit" className="button button-secondary">
          Apply
        </button>
      </form>
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="No transfers found" description="Try adjusting your filters." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <caption className="muted" style={{ captionSide: 'bottom', paddingTop: '0.5rem' }}>
            {data.total} transfer{data.total === 1 ? '' : 's'}
          </caption>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">State</th>
              <th scope="col">Amount</th>
              <th scope="col">User</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((transfer) => (
              <tr key={transfer.id}>
                <td>
                  <Link href={`/transfers/${transfer.id}`}>{truncateId(transfer.id)}</Link>
                </td>
                <td>
                  <StatusBadge value={transfer.state} />
                </td>
                <td>
                  {transfer.sourceAmount} {transfer.sourceCurrency} → {transfer.destinationAmount}{' '}
                  {transfer.destinationCurrency}
                </td>
                <td>
                  <Link href={`/users/${transfer.userId}`}>{truncateId(transfer.userId)}</Link>
                </td>
                <td>{formatDateTime(transfer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
