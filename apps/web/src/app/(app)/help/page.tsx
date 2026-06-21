'use client';

import { useEffect, useState } from 'react';
import type { SupportTicket } from '@rupeeroute/api-contracts';
import { customerApi } from '@rupeeroute/api-contracts';
import { EmptyState, LoadingState } from '../../../components/ui-states';
import { useT } from '../../../lib/i18n';

export default function HelpPage() {
  const t = useT();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void customerApi
      .listSupportTickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ticket = await customerApi.createSupportTicket({ subject, description });
    setTickets((prev) => [ticket, ...prev]);
    setSubject('');
    setDescription('');
  }

  if (loading) return <LoadingState />;

  return (
    <div className="container narrow">
      <h1>{t.help.title}</h1>
      <section className="card">
        <h2>{t.help.pricing}</h2>
        <p>{t.help.pricingText}</p>
      </section>
      <section className="card">
        <h2>{t.help.newTicket}</h2>
        <form onSubmit={(e) => void submit(e)}>
          <label htmlFor="subject">{t.help.subject}</label>
          <input
            id="subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <label htmlFor="description">{t.help.description}</label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" className="button">
            {t.help.submit}
          </button>
        </form>
      </section>
      <section>
        <h2>Tickets</h2>
        {tickets.length === 0 ? (
          <EmptyState message={t.help.empty} />
        ) : (
          <ul className="list card">
            {tickets.map((tk) => (
              <li key={tk.id}>
                <strong>{tk.subject}</strong> — {tk.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
