'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { useT } from '../lib/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

const links = [
  { href: '/dashboard', key: 'dashboard' as const },
  { href: '/send', key: 'send' as const },
  { href: '/transfers', key: 'transfers' as const },
  { href: '/recipients', key: 'recipients' as const },
  { href: '/help', key: 'help' as const },
  { href: '/settings', key: 'settings' as const },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = useT();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/dashboard" className="brand">
          {t.appName}
        </Link>
        <div className="app-header-actions">
          <LanguageSwitcher />
          <p className="muted user-email" aria-label="Signed in as">
            {user?.email}
          </p>
        </div>
      </header>
      <nav className="app-nav" aria-label="Main">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
            className={pathname.startsWith(link.href) ? 'nav-link active' : 'nav-link'}
          >
            {t.nav[link.key]}
          </Link>
        ))}
        <button type="button" className="nav-link button-link" onClick={logout}>
          {t.settings.signOut}
        </button>
      </nav>
      <div className="app-content">{children}</div>
    </div>
  );
}
