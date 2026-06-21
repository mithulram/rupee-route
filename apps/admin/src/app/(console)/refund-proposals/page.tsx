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
import { approveRefundProposal, createRefundProposal, listRefundProposals } from '../../../lib/api';
import { formatDateTime, truncateId } from '../../../lib/format';
import { canManageFinance } from '../../../lib/rbac';

export default function RefundProposalsPage() {
  const { roles } = useAuth();
  const canManage = canManageFinance(roles);
  const [showForm, setShowForm] = useState(false);
  const [transferId, setTransferId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useAsyncData(() => listRefundProposals());

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    try {
      await createRefundProposal({ transferId, amount, reason });
      setShowForm(false);
      setTransferId('');
      setAmount('');
      setReason('');
      reload();
    } catch {
      setActionError('Unable to create refund proposal.');
    }
  }

  async function handleApprove(id: string) {
    setActionError(null);
    try {
      await approveRefundProposal(id);
      reload();
    } catch {
      setActionError('Unable to approve proposal.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Refund proposals"
        description="Finance review for customer refunds"
        actions={
          canManage ? (
            <button
              type="button"
              className="button"
              onClick={() => {
                setShowForm((value) => !value);
              }}
            >
              {showForm ? 'Cancel' : 'New proposal'}
            </button>
          ) : undefined
        }
      />
      {showForm && canManage ? (
        <form className="card" onSubmit={(e) => void handleCreate(e)}>
          <h3>Create refund proposal</h3>
          <label htmlFor="refund-transfer">Transfer ID</label>
          <input
            id="refund-transfer"
            required
            value={transferId}
            onChange={(e) => {
              setTransferId(e.target.value);
            }}
          />
          <label htmlFor="refund-amount">Amount</label>
          <input
            id="refund-amount"
            required
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
            }}
          />
          <label htmlFor="refund-reason">Reason</label>
          <textarea
            id="refund-reason"
            required
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
            }}
          />
          <div className="inline-actions">
            <button type="submit" className="button">
              Submit
            </button>
          </div>
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
        <EmptyState title="No refund proposals" />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Transfer</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col">Proposed by</th>
              <th scope="col">Created</th>
              {canManage ? <th scope="col">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.items.map((proposal) => (
              <tr key={proposal.id}>
                <td>
                  <Link href={`/transfers/${proposal.transferId}`}>
                    {truncateId(proposal.transferId)}
                  </Link>
                </td>
                <td>
                  {proposal.amount} {proposal.currency}
                </td>
                <td>
                  <StatusBadge value={proposal.status} />
                </td>
                <td>{proposal.proposedBy}</td>
                <td>{formatDateTime(proposal.createdAt)}</td>
                {canManage ? (
                  <td>
                    {proposal.status === 'pending' ? (
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => void handleApprove(proposal.id)}
                      >
                        Approve
                      </button>
                    ) : (
                      '—'
                    )}
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
