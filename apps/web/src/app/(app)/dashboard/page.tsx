'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { RecipientResponse, TransferSummary } from '@rupeeroute/api-contracts';
import { customerApi } from '@rupeeroute/api-contracts';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui-states';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatMoney } from '../../../lib/format';
import { getRateAlerts, getSendDraft } from '../../../lib/auth-storage';
import { useT } from '../../../lib/i18n';

export default function DashboardPage() {
  const t = useT();
  const [transfers, setTransfers] = useState<TransferSummary[]>([]);
  const [recipients, setRecipients] = useState<RecipientResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const draft = getSendDraft();
  const alerts = getRateAlerts();

  useEffect(() => {
    void (async () => {
      try {
        const [tx, rc] = await Promise.all([
          customerApi.listTransfers(),
          customerApi.listRecipients(),
        ]);
        setTransfers(tx.slice(0, 5));
        setRecipients(rc.slice(0, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : t.common.error);
      } finally {
        setLoading(false);
      }
    })();
  }, [t.common.error]);

  if (loading) return <LoadingState label={t.common.loading} />;
  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => window.location.reload()}
        retryLabel={t.common.retry}
      />
    );

  return (
    <div className="container">
      <header className="page-header">
        <h1>{t.dashboard.title}</h1>
        <Link href="/send" className="button">
          {t.dashboard.sendCta}
        </Link>
      </header>

      {draft?.step ? (
        <section className="card alert-card">
          <p>{t.dashboard.continueSend}</p>
          <Link href="/send" className="button button-secondary">
            {t.dashboard.continueSend}
          </Link>
        </section>
      ) : null}

      <section className="card-grid">
        <article className="card">
          <h2>{t.dashboard.recentTransfers}</h2>
          {transfers.length === 0 ? (
            <EmptyState message={t.dashboard.emptyTransfers} />
          ) : (
            <ul className="list">
              {transfers.map((tx) => (
                <li key={tx.id}>
                  <Link href={`/transfers/${tx.id}`}>
                    <StatusBadge state={tx.state} />
                    {' — '}
                    {tx.sourceAmountMinor && tx.sourceCurrency
                      ? formatMoney(tx.sourceAmountMinor, tx.sourceCurrency)
                      : tx.id}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/transfers" className="button-link">
            {t.nav.transfers}
          </Link>
        </article>

        <article className="card">
          <h2>{t.dashboard.savedRecipients}</h2>
          {recipients.length === 0 ? (
            <EmptyState message={t.recipients.empty} />
          ) : (
            <ul className="list">
              {recipients.map((r) => (
                <li key={r.id}>{r.displayName}</li>
              ))}
            </ul>
          )}
          <Link href="/recipients" className="button-link">
            {t.nav.recipients}
          </Link>
        </article>

        <article className="card">
          <h2>{t.dashboard.rateAlerts}</h2>
          {alerts.length === 0 ? (
            <p className="muted">{t.common.empty}</p>
          ) : (
            <ul className="list">
              {alerts.map((a) => (
                <li key={`${a.currency}-${a.targetRate}`}>
                  {a.currency} @ {a.targetRate}
                </li>
              ))}
            </ul>
          )}
          <Link href="/settings" className="button-link">
            {t.nav.settings}
          </Link>
        </article>
      </section>
    </div>
  );
}
