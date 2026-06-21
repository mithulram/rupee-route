'use client';

import { useEffect } from 'react';
import { getTheme, setTheme } from './auth-storage';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setTheme(getTheme());
  }, []);

  return <>{children}</>;
}

export function ThemeToggle() {
  const cycle = () => {
    const current = getTheme();
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="button button-secondary"
      onClick={cycle}
      aria-label="Toggle theme"
    >
      Theme
    </button>
  );
}
