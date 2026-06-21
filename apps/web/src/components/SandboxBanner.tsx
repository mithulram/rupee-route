'use client';

import { useT } from '../lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SandboxBanner() {
  const t = useT();

  if (process.env.NEXT_PUBLIC_SANDBOX_BANNER === 'false') return null;

  return (
    <div role="status" className="sandbox-banner">
      <span>{t.sandboxNote}</span>
      <LanguageSwitcher />
    </div>
  );
}
