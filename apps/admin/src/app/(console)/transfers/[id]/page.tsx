'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '../../../../components/empty-state';
import { ErrorState } from '../../../../components/error-state';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { StatusBadge } from '../../../../components/status-badge';
import { useAuth } from '../../../../hooks/use-auth';
import { useAsyncData } from '../../../../hooks/use-async-data';
import { getTransfer } from '../../../../lib/api';
import { formatDateTime } from '../../../../lib/format';
import { isReadOnly } from '../../../../lib/rbac';

type Tab = 'timeline' | 'ledger' | 'webhooks' | 'audit' | 'tickets';

export default function TransferDetailPage() {
  const params = useParams<{ id: string }>();
  const { roles } = useAuth();
  const readOnly = isReadOnly(roles);
  const [tab, setTab] = useState<Tab>('timeline');

  const { data, error, isLoading, reload } = useAsyncData(() => getTransfer(params.id), params.id);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'ledger', label: 'Ledger' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'audit', label: 'Audit' },
    { id: 'tickets', label: 'Tickets' },
  ];

  return (
    <div>
      <PageHeader
        title={`Transfer ${params.id}`}
        description={readOnly ? 'Read-only view (auditor)' : 'Full transfer detail'}
        actions={
          data ? (
            <Link href={`/users/${data.transfer.userId}`} className="button button-secondary">
              View user
            </Link>
          ) : undefined
        }
      />
      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {data ? (
        <>
          <section className="card" aria-labelledby="transfer-summary">
            <h3 id="transfer-summary">Summary</h3>
            <dl className="detail-grid">
              <div>
                <dt>State</dt>
                <dd>
                  <StatusBadge value={data.transfer.state} />
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>
                  {data.transfer.sourceAmount} {data.transfer.sourceCurrency} →{' '}
                  {data.transfer.destinationAmount} {data.transfer.destinationCurrency}
                </dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>
                  <Link href={`/users/${data.transfer.userId}`}>{data.transfer.userId}</Link>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(data.transfer.createdAt)}</dd>
              </div>
              {data.transfer.reference ? (
                <div>
                  <dt>Reference</dt>
                  <dd>{data.transfer.reference}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {data.quote ? (
            <section className="card" aria-labelledby="quote-heading">
              <h3 id="quote-heading">Quote</h3>
              <dl className="detail-grid">
                <div>
                  <dt>Rate</dt>
                  <dd>{data.quote.rate}</dd>
                </div>
                <div>
                  <dt>Fee</dt>
                  <dd>{data.quote.feeAmount}</dd>
                </div>
                <div>
                  <dt>Expires</dt>
                  <dd>{formatDateTime(data.quote.expiresAt)}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {data.recipient ? (
            <section className="card" aria-labelledby="recipient-heading">
              <h3 id="recipient-heading">Recipient</h3>
              <dl className="detail-grid">
                <div>
                  <dt>Name</dt>
                  <dd>{data.recipient.displayName}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{data.recipient.type}</dd>
                </div>
                <div>
                  <dt>Account</dt>
                  <dd>{data.recipient.accountMask}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          <div className="tabs" role="tablist" aria-label="Transfer detail sections">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'tab tab-active' : 'tab'}
                onClick={() => {
                  setTab(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'timeline' ? (
            <section className="card" aria-labelledby="timeline-heading">
              <h3 id="timeline-heading">State history</h3>
              {data.stateHistory.length === 0 ? (
                <EmptyState title="No state changes" />
              ) : (
                <ol className="timeline">
                  {data.stateHistory.map((entry) => (
                    <li key={entry.id}>
                      <strong>
                        {entry.fromState ? `${entry.fromState} → ` : ''}
                        {entry.toState}
                      </strong>
                      {entry.reason ? <p className="muted">{entry.reason}</p> : null}
                      <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : null}

          {tab === 'ledger' ? (
            <section className="card" aria-labelledby="ledger-heading">
              <h3 id="ledger-heading">Ledger entries</h3>
              {data.ledgerEntries.length === 0 ? (
                <EmptyState title="No ledger entries" />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col">Direction</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ledgerEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.type}</td>
                        <td>{entry.direction}</td>
                        <td>
                          {entry.amount} {entry.currency}
                        </td>
                        <td>{formatDateTime(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {tab === 'webhooks' ? (
            <section className="card" aria-labelledby="webhooks-heading">
              <h3 id="webhooks-heading">Webhook events</h3>
              {data.webhookEvents.length === 0 ? (
                <EmptyState title="No webhook events" />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Provider</th>
                      <th scope="col">Event</th>
                      <th scope="col">Status</th>
                      <th scope="col">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.webhookEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{event.provider}</td>
                        <td>{event.eventType}</td>
                        <td>
                          <StatusBadge value={event.status} />
                        </td>
                        <td>{formatDateTime(event.receivedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {tab === 'audit' ? (
            <section className="card" aria-labelledby="audit-heading">
              <h3 id="audit-heading">Related audit events</h3>
              {data.auditEvents.length === 0 ? (
                <EmptyState title="No audit events" />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Action</th>
                      <th scope="col">Actor</th>
                      <th scope="col">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.auditEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{event.action}</td>
                        <td>{event.actorEmail ?? 'system'}</td>
                        <td>{formatDateTime(event.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}

          {tab === 'tickets' ? (
            <section className="card" aria-labelledby="tickets-heading">
              <h3 id="tickets-heading">Linked tickets</h3>
              {!data.tickets || data.tickets.length === 0 ? (
                <EmptyState
                  title="No linked tickets"
                  description={readOnly ? undefined : 'Create a ticket from the tickets page.'}
                />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Subject</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <Link href={`/tickets?highlight=${ticket.id}`}>{ticket.subject}</Link>
                        </td>
                        <td>
                          <StatusBadge value={ticket.status} />
                        </td>
                        <td>{ticket.priority}</td>
                        <td>{formatDateTime(ticket.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
