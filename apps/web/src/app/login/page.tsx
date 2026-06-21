'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useT } from '../../lib/i18n';

export default function LoginPage() {
  const t = useT();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container narrow">
      <h1>{t.auth.login}</h1>
      <form onSubmit={onSubmit} aria-label={t.auth.login}>
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="button" disabled={loading}>
          {loading ? t.common.loading : t.auth.submitLogin}
        </button>
      </form>
      <p className="muted">
        {t.auth.noAccount} <a href="/register">{t.auth.register}</a>
      </p>
    </div>
  );
}
