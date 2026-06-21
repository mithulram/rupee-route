'use client';

import Link from 'next/link';
import { RateCalculator } from '../components/RateCalculator';
import { useT } from '../lib/i18n';

export default function HomePage() {
  const t = useT();

  return (
    <div className="container">
      <header className="hero">
        <p className="eyebrow">{t.landing.eyebrow}</p>
        <h1>{t.landing.title}</h1>
        <p className="lead">{t.landing.lead}</p>
      </header>

      <RateCalculator />

      <section className="card-grid" aria-label="Getting started">
        <article className="card">
          <h2>{t.auth.register}</h2>
          <p>{t.landing.lead}</p>
          <Link href="/register" className="button">
            {t.landing.register}
          </Link>
        </article>
        <article className="card">
          <h2>{t.auth.login}</h2>
          <p>{t.landing.deliveryNote}</p>
          <Link href="/login" className="button button-secondary">
            {t.landing.signIn}
          </Link>
        </article>
      </section>

      <footer className="footer">
        <p className="muted">{t.landing.deliveryNote}</p>
        <p>
          <Link href="/legal/terms">{t.legal.terms}</Link>
          {' · '}
          <Link href="/legal/privacy">{t.legal.privacy}</Link>
        </p>
      </footer>
    </div>
  );
}
