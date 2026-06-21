'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { QuoteResponse, RecipientResponse, TransferDetail } from '@rupeeroute/api-contracts';
import { customerApi, newIdempotencyKey } from '@rupeeroute/api-contracts';
import { LoadingState } from '../../../components/ui-states';
import {
  formatCountdown,
  formatMoney,
  isQuoteExpired,
  quoteSecondsRemaining,
  toMinorUnits,
} from '../../../lib/format';
import { getSendDraft, saveSendDraft } from '../../../lib/auth-storage';
import { useT } from '../../../lib/i18n';

type Step = 'amount' | 'recipient' | 'review' | 'funding';

export default function SendPage() {
  return <SendFlow />;
}

function SendFlow() {
  const t = useT();
  const router = useRouter();
  const draft = getSendDraft();
  const [step, setStep] = useState<Step>((draft?.step as Step) ?? 'amount');
  const [currency, setCurrency] = useState<'EUR' | 'CHF'>(
    (draft?.currency as 'EUR' | 'CHF') ?? 'EUR',
  );
  const [amount, setAmount] = useState(draft?.amount ?? '100');
  const [coupon, setCoupon] = useState(draft?.coupon ?? '');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [recipients, setRecipients] = useState<RecipientResponse[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState(draft?.recipientId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const persist = useCallback(
    (next: Partial<Record<string, string>>) => {
      saveSendDraft({ step, currency, amount, coupon, recipientId: selectedRecipient, ...next });
    },
    [step, currency, amount, coupon, selectedRecipient],
  );

  useEffect(() => {
    if (!quote) return;
    const tick = () => setCountdown(quoteSecondsRemaining(quote.expiresAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [quote]);

  useEffect(() => {
    void customerApi
      .listRecipients()
      .then(setRecipients)
      .catch(() => undefined);
  }, []);

  async function createQuote() {
    setLoading(true);
    setError(null);
    try {
      const minor = toMinorUnits(amount, currency);
      const q = await customerApi.createQuote(
        { sourceCurrency: currency, sourceAmountMinor: minor, couponCode: coupon || undefined },
        newIdempotencyKey(),
      );
      setQuote(q);
      const tx = await customerApi.createTransfer(q.id, newIdempotencyKey());
      setTransfer(tx);
      setStep('recipient');
      persist({ step: 'recipient' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  async function attachRecipient() {
    if (!transfer || !selectedRecipient) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await customerApi.attachRecipient(
        transfer.id,
        selectedRecipient,
        newIdempotencyKey(),
      );
      setTransfer(updated);
      setStep('review');
      persist({ step: 'review' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmTransfer() {
    if (!transfer || !quote) return;
    if (isQuoteExpired(quote.expiresAt)) {
      setError(t.send.quoteExpired);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await customerApi.confirmTransfer(transfer.id, newIdempotencyKey());
      setTransfer(updated);
      setStep('funding');
      persist({ step: 'funding' });
      saveSendDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container narrow">
      <h1>{t.send.title}</h1>
      <ol className="stepper" aria-label="Send steps">
        <li
          aria-current={step === 'amount' ? 'step' : undefined}
          className={step === 'amount' ? 'active' : ''}
        >
          {t.send.stepAmount}
        </li>
        <li
          aria-current={step === 'recipient' ? 'step' : undefined}
          className={step === 'recipient' ? 'active' : ''}
        >
          {t.send.stepRecipient}
        </li>
        <li
          aria-current={step === 'review' ? 'step' : undefined}
          className={step === 'review' ? 'active' : ''}
        >
          {t.send.stepReview}
        </li>
        <li
          aria-current={step === 'funding' ? 'step' : undefined}
          className={step === 'funding' ? 'active' : ''}
        >
          {t.send.stepFunding}
        </li>
      </ol>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? <LoadingState /> : null}

      {step === 'amount' ? (
        <section className="card">
          <label htmlFor="send-currency">{t.send.currency}</label>
          <select
            id="send-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'EUR' | 'CHF')}
          >
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>
          <label htmlFor="send-amount">{t.send.amount}</label>
          <input
            id="send-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <label htmlFor="send-coupon">{t.send.coupon}</label>
          <input id="send-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          <button
            type="button"
            className="button"
            disabled={loading}
            onClick={() => void createQuote()}
          >
            {t.send.next}
          </button>
        </section>
      ) : null}

      {step === 'recipient' && quote ? (
        <section className="card">
          <dl className="quote-summary">
            <div>
              <dt>{t.send.youSend}</dt>
              <dd>{formatMoney(quote.sourceAmountMinor, quote.sourceCurrency)}</dd>
            </div>
            <div>
              <dt>{t.send.recipientGets}</dt>
              <dd>{formatMoney(quote.targetAmountMinor, 'INR')}</dd>
            </div>
            <div>
              <dt>{t.send.rate}</dt>
              <dd>{quote.customerRate}</dd>
            </div>
            <div>
              <dt>{t.send.margin}</dt>
              <dd>{quote.marginDisclosure}</dd>
            </div>
          </dl>
          <label htmlFor="recipient-select">{t.send.selectRecipient}</label>
          <select
            id="recipient-select"
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
          >
            <option value="">—</option>
            {recipients.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName}
              </option>
            ))}
          </select>
          <Link href="/recipients/new" className="button-link">
            {t.send.addRecipient}
          </Link>
          <div className="button-row">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setStep('amount')}
            >
              {t.send.back}
            </button>
            <button
              type="button"
              className="button"
              disabled={!selectedRecipient || loading}
              onClick={() => void attachRecipient()}
            >
              {t.send.next}
            </button>
          </div>
        </section>
      ) : null}

      {step === 'review' && quote && transfer ? (
        <section className="card">
          <h2>{t.send.reviewTitle}</h2>
          <p aria-live="polite">
            {t.send.quoteExpires}: {formatCountdown(countdown)}
          </p>
          <dl className="quote-summary">
            <div>
              <dt>{t.send.youSend}</dt>
              <dd>{formatMoney(quote.sourceAmountMinor, quote.sourceCurrency)}</dd>
            </div>
            <div>
              <dt>{t.send.recipientGets}</dt>
              <dd>{formatMoney(quote.targetAmountMinor, 'INR')}</dd>
            </div>
            <div>
              <dt>{t.send.allInRate}</dt>
              <dd>{quote.customerRate}</dd>
            </div>
            <div>
              <dt>{t.send.fxMargin}</dt>
              <dd>{quote.marginPercent}%</dd>
            </div>
            <div>
              <dt>{t.send.deliveryEstimate}</dt>
              <dd>{quote.deliveryEstimate}</dd>
            </div>
          </dl>
          <p className="muted">{t.send.reviewDisclaimer}</p>
          {isQuoteExpired(quote.expiresAt) ? (
            <button
              type="button"
              className="button"
              onClick={() => {
                setStep('amount');
                void createQuote();
              }}
            >
              {t.send.requote}
            </button>
          ) : (
            <div className="button-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setStep('recipient')}
              >
                {t.send.back}
              </button>
              <button
                type="button"
                className="button"
                disabled={loading}
                onClick={() => void confirmTransfer()}
              >
                {t.send.confirm}
              </button>
            </div>
          )}
        </section>
      ) : null}

      {step === 'funding' && transfer ? (
        <section className="card">
          <h2>{t.send.fundingTitle}</h2>
          <p>{t.send.fundingNote}</p>
          {transfer.fundingReference ? (
            <p>
              <strong>{t.send.fundingReference}:</strong> {transfer.fundingReference}
            </p>
          ) : null}
          <button
            type="button"
            className="button"
            onClick={() => router.push(`/transfers/${transfer.id}`)}
          >
            {t.send.tracking}
          </button>
        </section>
      ) : null}
    </div>
  );
}
