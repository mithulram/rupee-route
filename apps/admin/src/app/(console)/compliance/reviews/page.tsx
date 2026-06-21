'use client';

import { useState } from 'react';
import { EmptyState } from '../../../../components/empty-state';
import { ErrorState } from '../../../../components/error-state';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { StatusBadge } from '../../../../components/status-badge';
import { useAuth } from '../../../../hooks/use-auth';
import { useAsyncData } from '../../../../hooks/use-async-data';
import { decideComplianceReview, listComplianceReviews } from '../../../../lib/api';
import { formatDateTime } from '../../../../lib/format';
import { canDecideCompliance } from '../../../../lib/rbac';

export default function ComplianceReviewsPage() {
  const { roles } = useAuth();
  const canDecide = canDecideCompliance(roles);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useAsyncData(() => listComplianceReviews());

  async function handleDecide(id: string, decision: 'approve' | 'decline') {
    setActionError(null);
    try {
      await decideComplianceReview(id, decision);
      reload();
    } catch {
      setActionError('Unable to submit decision.');
    }
  }

  return (
    <div>
      <PageHeader title="Compliance reviews" description="KYC and risk review queue" />
      {actionError ? (
        <p role="alert" className="error">
          {actionError}
        </p>
      ) : null}
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.items.length === 0 ? (
        <EmptyState title="Queue empty" description="No pending compliance reviews." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Status</th>
              <th scope="col">Risk score</th>
              <th scope="col">Flags</th>
              <th scope="col">Submitted</th>
              {canDecide ? <th scope="col">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.items.map((review) => (
              <tr key={review.id}>
                <td>{review.userEmail}</td>
                <td>
                  <StatusBadge value={review.status} />
                </td>
                <td>{review.riskScore}</td>
                <td>{review.flags.join(', ') || '—'}</td>
                <td>{formatDateTime(review.submittedAt)}</td>
                {canDecide ? (
                  <td className="inline-actions">
                    {review.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          className="button button-small"
                          onClick={() => void handleDecide(review.id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="button button-small button-danger"
                          onClick={() => void handleDecide(review.id, 'decline')}
                        >
                          Decline
                        </button>
                      </>
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
