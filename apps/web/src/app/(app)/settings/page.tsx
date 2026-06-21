'use client';

import { useEffect, useState } from 'react';
import { customerApi } from '@rupeeroute/api-contracts';
import { useAuth } from '../../../lib/auth-context';
import {
  getPreferredLanguage,
  getRateAlerts,
  getRegisteredDevices,
  getTheme,
  registerDevice,
  saveRateAlerts,
  setPreferredLanguage,
} from '../../../lib/auth-storage';
import { ThemeToggle } from '../../../lib/theme';
import { useI18n, useT } from '../../../lib/i18n';

export default function SettingsPage() {
  const t = useT();
  const { user, logout, refresh } = useAuth();
  const { setLocale } = useI18n();
  const [notifications, setNotifications] = useState(user?.notificationEmail ?? true);
  const [lang, setLang] = useState<'en' | 'de'>(getPreferredLanguage());
  const [alertRate, setAlertRate] = useState('90.00');
  const [alertCurrency, setAlertCurrency] = useState('EUR');
  const [devices] = useState(getRegisteredDevices());
  const [alerts, setAlerts] = useState(getRateAlerts());

  useEffect(() => {
    registerDevice(`Browser ${new Date().toISOString().slice(0, 10)}`);
  }, []);

  async function saveProfile() {
    setPreferredLanguage(lang);
    setLocale(lang);
    await customerApi.updateMe({ preferredLanguage: lang, notificationEmail: notifications });
    await refresh();
  }

  function addAlert() {
    const next = [...alerts, { currency: alertCurrency, targetRate: alertRate }];
    setAlerts(next);
    saveRateAlerts(next);
  }

  return (
    <div className="container narrow">
      <h1>{t.settings.title}</h1>
      <section className="card">
        <h2>{t.settings.profile}</h2>
        <p>{user?.email}</p>
        <label htmlFor="lang">{t.settings.language}</label>
        <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'de')}>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          {t.settings.notifications}
        </label>
        <button type="button" className="button" onClick={() => void saveProfile()}>
          {t.common.save}
        </button>
      </section>
      <section className="card">
        <h2>{t.settings.theme}</h2>
        <ThemeToggle />
        <p className="muted">Current: {getTheme()}</p>
      </section>
      <section className="card">
        <h2>{t.dashboard.rateAlerts}</h2>
        <div className="button-row">
          <select value={alertCurrency} onChange={(e) => setAlertCurrency(e.target.value)}>
            <option value="EUR">EUR/INR</option>
            <option value="CHF">CHF/INR</option>
          </select>
          <input
            value={alertRate}
            onChange={(e) => setAlertRate(e.target.value)}
            aria-label="Target rate"
          />
          <button type="button" className="button button-secondary" onClick={addAlert}>
            Add
          </button>
        </div>
        <ul className="list">
          {alerts.map((a) => (
            <li key={`${a.currency}-${a.targetRate}`}>
              {a.currency} @ {a.targetRate}
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>{t.settings.devices}</h2>
        <ul className="list">
          {devices.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>{t.settings.privacy}</h2>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => void customerApi.createPrivacyRequest('export')}
        >
          {t.settings.export}
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => void customerApi.createPrivacyRequest('delete')}
        >
          {t.settings.delete}
        </button>
      </section>
      <button type="button" className="button" onClick={logout}>
        {t.settings.signOut}
      </button>
    </div>
  );
}
