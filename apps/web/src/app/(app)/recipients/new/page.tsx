'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { customerApi } from '@rupeeroute/api-contracts';
import { useT } from '../../../../lib/i18n';

export default function NewRecipientPage() {
  const t = useT();
  const router = useRouter();
  const [type, setType] = useState<'bank_account' | 'upi'>('bank_account');
  const [displayName, setDisplayName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await customerApi.createRecipient(
        type === 'bank_account'
          ? { type, displayName, accountHolder, ifsc, accountNumber }
          : { type, displayName, accountHolder, upiId },
      );
      router.push('/recipients');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  }

  return (
    <div className="container narrow">
      <h1>{t.recipients.new}</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="card">
        <label htmlFor="type">{t.recipients.type}</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as 'bank_account' | 'upi')}
        >
          <option value="bank_account">{t.recipients.bank}</option>
          <option value="upi">{t.recipients.upi}</option>
        </select>
        <label htmlFor="displayName">{t.recipients.displayName}</label>
        <input
          id="displayName"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <label htmlFor="accountHolder">{t.recipients.accountHolder}</label>
        <input
          id="accountHolder"
          required
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
        />
        {type === 'bank_account' ? (
          <>
            <label htmlFor="ifsc">{t.recipients.ifsc}</label>
            <input id="ifsc" required value={ifsc} onChange={(e) => setIfsc(e.target.value)} />
            <label htmlFor="accountNumber">{t.recipients.accountNumber}</label>
            <input
              id="accountNumber"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </>
        ) : (
          <>
            <label htmlFor="upiId">{t.recipients.upiId}</label>
            <input id="upiId" required value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </>
        )}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="button">
          {t.recipients.save}
        </button>
      </form>
    </div>
  );
}
