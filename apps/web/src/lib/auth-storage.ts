import type { UserProfile } from '@rupeeroute/api-contracts';

const TOKEN_KEY = 'rr_token';
const USER_KEY = 'rr_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: UserProfile) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getPreferredLanguage(): 'en' | 'de' {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('rr_lang');
  return stored === 'de' ? 'de' : 'en';
}

export function setPreferredLanguage(lang: 'en' | 'de') {
  localStorage.setItem('rr_lang', lang);
}

export function getTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('rr_theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function setTheme(theme: 'light' | 'dark' | 'system') {
  localStorage.setItem('rr_theme', theme);
  document.documentElement.dataset.theme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
}

export function getRateAlerts(): { currency: string; targetRate: string }[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('rr_rate_alerts');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as { currency: string; targetRate: string }[];
  } catch {
    return [];
  }
}

export function saveRateAlerts(alerts: { currency: string; targetRate: string }[]) {
  localStorage.setItem('rr_rate_alerts', JSON.stringify(alerts));
}

export function getSendDraft(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('rr_send_draft');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export function saveSendDraft(draft: Record<string, string> | null) {
  if (!draft) {
    sessionStorage.removeItem('rr_send_draft');
    return;
  }
  sessionStorage.setItem('rr_send_draft', JSON.stringify(draft));
}

export function getRegisteredDevices(): string[] {
  if (typeof window === 'undefined') return ['This browser (sandbox)'];
  const raw = localStorage.getItem('rr_devices');
  if (!raw) return ['This browser (sandbox)'];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return ['This browser (sandbox)'];
  }
}

export function registerDevice(label: string) {
  const devices = getRegisteredDevices();
  if (!devices.includes(label)) {
    localStorage.setItem('rr_devices', JSON.stringify([...devices, label]));
  }
}
