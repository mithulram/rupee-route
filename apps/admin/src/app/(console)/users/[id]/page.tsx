'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ErrorState } from '../../../../components/error-state';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { StatusBadge } from '../../../../components/status-badge';
import { useAsyncData } from '../../../../hooks/use-async-data';
import { getUser } from '../../../../lib/api';
import { formatDateTime } from '../../../../lib/format';

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, isLoading, reload } = useAsyncData(() => getUser(params.id), params.id);

  return (
    <div>
      <PageHeader title="User detail" description={`End user ${params.id}`} />
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <section className="card">
          <dl className="detail-grid">
            <div>
              <dt>Email</dt>
              <dd>{data.email}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{data.countryCode}</dd>
            </div>
            <div>
              <dt>KYC status</dt>
              <dd>
                <StatusBadge value={data.kycStatus} />
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(data.createdAt)}</dd>
            </div>
            {typeof data.transferCount === 'number' ? (
              <div>
                <dt>Transfers</dt>
                <dd>{data.transferCount}</dd>
              </div>
            ) : null}
          </dl>
          <div className="inline-actions">
            <Link href={`/transfers?userId=${data.id}`} className="button button-secondary">
              View transfers
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
