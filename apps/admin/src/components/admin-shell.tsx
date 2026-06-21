'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { filterNavByRoles } from '../lib/rbac';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, roles, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="auth-loading" role="status">
        <p className="muted">Checking session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = filterNavByRoles(roles);

  return (
    <div className="admin-shell">
      <aside aria-label="Admin navigation">
        <h1>RupeeRoute Ops</h1>
        <p className="admin-user" aria-label="Signed in as">
          {admin?.email}
        </p>
        <nav>
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={active ? 'nav-active' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="button button-ghost sidebar-logout"
          onClick={() => {
            logout();
            router.replace('/login');
          }}
        >
          Sign out
        </button>
      </aside>
      <main>{children}</main>
    </div>
  );
}
