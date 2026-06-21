'use client';

import { AuthProvider } from '../lib/auth-context';
import { I18nProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
