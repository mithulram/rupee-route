'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '@rupeeroute/api-contracts';
import { configureCustomerApi, customerApi } from '@rupeeroute/api-contracts';
import { clearSession, getToken, setSession } from './auth-storage';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, countryCode: 'DE' | 'CH') => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    configureCustomerApi({
      getToken: () => getToken(),
      onUnauthorized: () => {
        clearSession();
        setUser(null);
      },
    });
  }, []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await customerApi.getMe();
      setUser(profile);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await customerApi.login({ email, password });
    setSession(res.accessToken, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, countryCode: 'DE' | 'CH') => {
      const res = await customerApi.register({ email, password, countryCode });
      setSession(res.accessToken, res.user);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
