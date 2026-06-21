import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { customerApi, type UserProfile } from '@rupeeroute/api-contracts';
import {
  clearSecureSession,
  getAccessToken,
  getStoredProfile,
  setAccessToken,
  setStoredProfile,
} from '../services/secureStorage';
import { setInMemoryToken, setupCustomerApi, syncTokenFromSecureStore } from '../services/apiSetup';
import { clearSendDraft } from '../services/sendDraftStorage';
import { clearTransferHistoryCache } from '../services/transferCache';

type AuthContextValue = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, countryCode: 'DE' | 'CH') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    setupCustomerApi(handleUnauthorized);

    void (async () => {
      try {
        const token = await syncTokenFromSecureStore();
        if (!token) {
          setIsLoading(false);
          return;
        }
        const cachedProfile = await getStoredProfile();
        if (cachedProfile) setUser(cachedProfile);
        const profile = await customerApi.getMe();
        setUser(profile);
        await setStoredProfile(profile);
      } catch {
        await clearSecureSession();
        setInMemoryToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [handleUnauthorized]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await customerApi.login({ email, password });
    await setAccessToken(response.accessToken);
    setInMemoryToken(response.accessToken);
    await setStoredProfile(response.user);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, countryCode: 'DE' | 'CH') => {
      const response = await customerApi.register({ email, password, countryCode });
      await setAccessToken(response.accessToken);
      setInMemoryToken(response.accessToken);
      await setStoredProfile(response.user);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearSecureSession();
    setInMemoryToken(null);
    await clearSendDraft();
    await clearTransferHistoryCache();
    setUser(null);
    router.replace('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    const profile = await customerApi.getMe();
    setUser(profile);
    await setStoredProfile(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile],
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
