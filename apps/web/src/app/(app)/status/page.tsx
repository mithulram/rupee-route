'use client';

import { useEffect, useState } from 'react';
import { customerApi } from '@rupeeroute/api-contracts';
import { ErrorState, LoadingState } from '../../../components/ui-states';
import { useT } from '../../../lib/i18n';

export default function StatusPage() {
  const t = useT();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void customerApi
      .getServiceStatus()
      .then((s) => setMessage(s.message))
      .catch(() => setError(t.status.error));
  }, [t.status.error]);

  if (error) return <ErrorState message={error} />;
  if (!message) return <LoadingState label={t.status.loading} />;

  return (
    <div className="container narrow">
      <h1>{t.status.title}</h1>
      <p className="card" role="status">
        {message}
      </p>
    </div>
  );
}
