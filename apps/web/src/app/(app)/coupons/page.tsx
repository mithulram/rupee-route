'use client';

import { useEffect, useState } from 'react';
import type { SandboxCoupon } from '@rupeeroute/api-contracts';
import { customerApi } from '@rupeeroute/api-contracts';
import { EmptyState, LoadingState } from '../../../components/ui-states';
import { useT } from '../../../lib/i18n';

export default function CouponsPage() {
  const t = useT();
  const [coupons, setCoupons] = useState<SandboxCoupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void customerApi
      .listCoupons()
      .then((res) => setCoupons(res.coupons))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="container narrow">
      <h1>{t.coupons.title}</h1>
      <p className="muted">{t.coupons.description}</p>
      {coupons.length === 0 ? (
        <EmptyState message={t.coupons.empty} />
      ) : (
        <ul className="list card">
          {coupons.map((c) => (
            <li key={c.code}>
              <strong>{c.code}</strong>
              <p>{c.label}</p>
              <p className="muted">
                −{c.marginBpsReduction} bps margin · expires {c.expiresAt ?? 'never'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
