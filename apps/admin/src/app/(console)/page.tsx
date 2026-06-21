'use client';

import { EmptyState } from '../../components/empty-state';
import { ErrorState } from '../../components/error-state';
import { LoadingState } from '../../components/loading-state';
import { PageHeader } from '../../components/page-header';
import { useAuth } from '../../hooks/use-auth';
import { useAsyncData } from '../../hooks/use-async-data';
import { getHealth } from '../../lib/api';

export default function OverviewPage() {
  const { admin, roles } = useAuth();
  const { data, error, isLoading, reload } = useAsyncData(() => getHealth());

  return (
    <div>
      <PageHeader title="Operations overview" description="Sandbox health and your admin session" />
      {isLoading ? <LoadingState label="Checking API health…" /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data ? (
        <div className="split-grid">
          <section className="card" aria-labelledby="health-heading">
            <h3 id="health-heading">API health</h3>
            <dl className="stats">
              <div>
                <dt>Status</dt>
                <dd>{data.status}</dd>
              </div>
              <div>
                <dt>Sandbox mode</dt>
                <dd>{data.sandboxMode ? 'Enabled' : 'Disabled'}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{data.service}</dd>
              </div>
            </dl>
          </section>
          <section className="card" aria-labelledby="session-heading">
            <h3 id="session-heading">Your session</h3>
            <dl className="stats">
              <div>
                <dt>Email</dt>
                <dd>{admin?.email}</dd>
              </div>
              <div>
                <dt>Roles</dt>
                <dd>{roles.join(', ') || '—'}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
      {!isLoading && !error && !data ? (
        <EmptyState
          title="No health data"
          description="The API did not return health information."
        />
      ) : null}
    </div>
  );
}
