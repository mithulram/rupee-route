'use client';

import { useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { useAuth } from '../../../hooks/use-auth';
import { useAsyncData } from '../../../hooks/use-async-data';
import { listFeatureFlags, updateFeatureFlag } from '../../../lib/api';
import { formatDateTime } from '../../../lib/format';
import { canEditFeatureFlags } from '../../../lib/rbac';

export default function FeatureFlagsPage() {
  const { roles } = useAuth();
  const canEdit = canEditFeatureFlags(roles);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useAsyncData(() => listFeatureFlags());

  async function handleToggle(key: string, enabled: boolean) {
    setActionError(null);
    setUpdatingKey(key);
    try {
      await updateFeatureFlag(key, enabled);
      reload();
    } catch {
      setActionError('Unable to update feature flag.');
    } finally {
      setUpdatingKey(null);
    }
  }

  return (
    <div>
      <PageHeader title="Feature flags" description="Administrator-only runtime toggles" />
      {actionError ? (
        <p role="alert" className="error">
          {actionError}
        </p>
      ) : null}
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!isLoading && !error && data?.flags.length === 0 ? (
        <EmptyState title="No feature flags configured" />
      ) : null}
      {!isLoading && !error && data && data.flags.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Description</th>
              <th scope="col">Enabled</th>
              <th scope="col">Updated</th>
              {canEdit ? <th scope="col">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.flags.map((flag) => (
              <tr key={flag.key}>
                <td>
                  <code>{flag.key}</code>
                </td>
                <td>{flag.description}</td>
                <td>{flag.enabled ? 'Yes' : 'No'}</td>
                <td>{formatDateTime(flag.updatedAt)}</td>
                {canEdit ? (
                  <td>
                    <button
                      type="button"
                      className="button button-small button-secondary"
                      disabled={updatingKey === flag.key}
                      onClick={() => void handleToggle(flag.key, !flag.enabled)}
                    >
                      {flag.enabled ? 'Disable' : 'Enable'}
                    </button>
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
