'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getPreferredLanguage, setPreferredLanguage as persistLang } from '../auth-storage';
import { de } from './de';
import { en } from './en';

export type Locale = 'en' | 'de';
type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, de };

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getPreferredLanguage());
  }, []);

  const setLocale = (next: Locale) => {
    persistLang(next);
    setLocaleState(next);
  };

  const value = useMemo(() => ({ locale, t: dictionaries[locale], setLocale }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n requires I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().t;
}
