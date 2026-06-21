'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppShell } from '../../components/AppShell';
import { LoadingState } from '../../components/ui-states';
import { useAuth } from '../../lib/auth-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="container">
        <LoadingState />
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}
