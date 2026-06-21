'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminLogin, getAdminMe } from '../lib/api';
import {
  clearAdminSession,
  getAdminToken,
  getStoredAdmin,
  setAdminSession,
} from '../lib/auth-storage';
import type { AdminRole, AdminUser } from '../lib/types';

interface AuthContextValue {
  admin: AdminUser | null;
  roles: AdminRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      return;
    }

    try {
      const me = await getAdminMe();
      setAdmin(me);
      setAdminSession(token, me);
    } catch {
      clearAdminSession();
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredAdmin();
    if (stored) {
      setAdmin({
        id: stored.id,
        email: stored.email,
        roles: stored.roles as AdminRole[],
      });
    }

    void (async () => {
      try {
        await refresh();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await adminLogin(email, password);
    setAdminSession(response.accessToken, response.admin);
    setAdmin(response.admin);
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      roles: admin?.roles ?? [],
      isLoading,
      isAuthenticated: Boolean(admin),
      login,
      logout,
      refresh,
    }),
    [admin, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
