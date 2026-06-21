'use client';

import { useI18n } from '../lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={locale === 'en' ? 'lang-btn active' : 'lang-btn'}
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={locale === 'de' ? 'lang-btn active' : 'lang-btn'}
        aria-pressed={locale === 'de'}
        onClick={() => setLocale('de')}
      >
        DE
      </button>
    </div>
  );
}
