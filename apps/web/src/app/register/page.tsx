'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useT } from '../../lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState<'DE' | 'CH'>('DE');
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await register(email, password, countryCode);
      router.push('/dashboard');
    } catch {
      setMessage(t.common.error);
    }
  }

  return (
    <div className="container narrow">
      <h1>{t.auth.register}</h1>
      <form onSubmit={(e) => void onSubmit(e)}>
        <label htmlFor="email">{t.auth.email}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="password">{t.auth.password}</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="country">{t.auth.country}</label>
        <select
          id="country"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value as 'DE' | 'CH')}
        >
          <option value="DE">Germany (EUR)</option>
          <option value="CH">Switzerland (CHF)</option>
        </select>
        {message ? (
          <p role="alert" className="error">
            {message}
          </p>
        ) : null}
        <button type="submit" className="button">
          {t.auth.submitRegister}
        </button>
      </form>
      <p>
        {t.auth.hasAccount} <a href="/login">{t.auth.login}</a>
      </p>
    </div>
  );
}
