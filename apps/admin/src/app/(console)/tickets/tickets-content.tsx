'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '../../../components/empty-state';
import { ErrorState } from '../../../components/error-state';
import { LoadingState } from '../../../components/loading-state';
import { PageHeader } from '../../../components/page-header';
import { StatusBadge } from '../../../components/status-badge';
import { useAuth } from '../../../hooks/use-auth';
import { useAsyncData } from '../../../hooks/use-async-data';
import { createTicket, listTickets, updateTicket } from '../../../lib/api';
import { formatDateTime, truncateId } from '../../../lib/format';
import { canWriteTickets } from '../../../lib/rbac';

export default function TicketsPageContent() {
  const { roles } = useAuth();
  const canWrite = canWriteTickets(roles);
  const searchParams = useSearchParams();
  const highlight = searchParams.get('highlight');

  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [transferId, setTransferId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, reload } = useAsyncData(() => listTickets());

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    try {
      await createTicket({
        subject,
        description,
        transferId: transferId || undefined,
        priority,
      });
      setShowForm(false);
      setSubject('');
      setDescription('');
      setTransferId('');
      reload();
    } catch {
      setActionError('Unable to create ticket.');
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setActionError(null);
    try {
      await updateTicket(id, { status });
      reload();
    } catch {
      setActionError('Unable to update ticket.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Support tickets"
        description="Track customer issues linked to transfers"
        actions={
          canWrite ? (
            <button
              type="button"
              className="button"
              onClick={() => {
                setShowForm((value) => !value);
              }}
            >
              {showForm ? 'Cancel' : 'New ticket'}
            </button>
          ) : undefined
        }
      />
      {showForm && canWrite ? (
        <form className="card" onSubmit={(e) => void handleCreate(e)} aria-label="Create ticket">
          <h3>Create ticket</h3>
          <label htmlFor="ticket-subject">Subject</label>
          <input
            id="ticket-subject"
            required
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
            }}
          />
          <label htmlFor="ticket-description">Description</label>
          <textarea
            id="ticket-description"
            required
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
          />
          <label htmlFor="ticket-transfer">Transfer ID (optional)</label>
          <input
            id="ticket-transfer"
            value={transferId}
            onChange={(e) => {
              setTransferId(e.target.value);
            }}
          />
          <label htmlFor="ticket-priority">Priority</label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="inline-actions">
            <button type="submit" className="button">
              Create
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
        <EmptyState title="No tickets" description="Support tickets will appear here." />
      ) : null}
      {!isLoading && !error && data && data.items.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col">Status</th>
              <th scope="col">Priority</th>
              <th scope="col">Transfer</th>
              <th scope="col">Updated</th>
              {canWrite ? <th scope="col">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {data.items.map((ticket) => (
              <tr
                key={ticket.id}
                style={
                  highlight === ticket.id
                    ? { background: 'var(--rr-color-surface-muted)' }
                    : undefined
                }
              >
                <td>{ticket.subject}</td>
                <td>
                  <StatusBadge value={ticket.status} />
                </td>
                <td>{ticket.priority}</td>
                <td>
                  {ticket.transferId ? (
                    <Link href={`/transfers/${ticket.transferId}`}>
                      {truncateId(ticket.transferId)}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{formatDateTime(ticket.updatedAt)}</td>
                {canWrite ? (
                  <td>
                    {ticket.status !== 'resolved' ? (
                      <button
                        type="button"
                        className="button button-small button-secondary"
                        onClick={() => void handleStatusChange(ticket.id, 'resolved')}
                      >
                        Resolve
                      </button>
                    ) : null}
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
