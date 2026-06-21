const TOKEN_KEY = 'rr_admin_token';
const ADMIN_KEY = 'rr_admin_user';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminSession(
  token: string,
  admin: { id: string; email: string; roles: string[] },
): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getStoredAdmin(): { id: string; email: string; roles: string[] } | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; email: string; roles: string[] };
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_KEY);
}
