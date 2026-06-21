'use client';

import { useMemo, useState } from 'react';
import { previewQuote } from '../lib/rates';
import { formatMoney, toMinorUnits } from '../lib/format';
import { useT } from '../lib/i18n';

export function RateCalculator() {
  const t = useT();
  const [currency, setCurrency] = useState<'EUR' | 'CHF'>('EUR');
  const [amount, setAmount] = useState('100');

  const preview = useMemo(() => {
    try {
      const minor = BigInt(toMinorUnits(amount, currency));
      const result = previewQuote(currency, minor);
      return {
        customerRate: result.customerRate,
        targetMinor: result.targetMinor.toString(),
        marginPercent: result.marginPercent,
      };
    } catch {
      return null;
    }
  }, [amount, currency]);

  return (
    <section className="card calculator" aria-labelledby="calc-heading">
      <h2 id="calc-heading">{t.landing.calculator}</h2>
      <label htmlFor="calc-currency">{t.send.currency}</label>
      <select
        id="calc-currency"
        value={currency}
        onChange={(e) => {
          setCurrency(e.target.value as 'EUR' | 'CHF');
        }}
      >
        <option value="EUR">EUR</option>
        <option value="CHF">CHF</option>
      </select>
      <label htmlFor="calc-amount">{t.landing.sourceAmount}</label>
      <input
        id="calc-amount"
        inputMode="decimal"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
        }}
        aria-describedby="calc-note"
      />
      {preview ? (
        <dl className="quote-summary">
          <div>
            <dt>{t.landing.recipientGets}</dt>
            <dd>{formatMoney(preview.targetMinor, 'INR')}</dd>
          </div>
          <div>
            <dt>All-in rate</dt>
            <dd>{preview.customerRate}</dd>
          </div>
          <div>
            <dt>FX margin</dt>
            <dd>{preview.marginPercent}%</dd>
          </div>
        </dl>
      ) : null}
      <p id="calc-note" className="muted">
        {t.landing.marginNote}
      </p>
    </section>
  );
}
