import { configureCustomerApi } from '@rupeeroute/api-contracts';
import { getAccessToken, clearSecureSession } from './secureStorage';

let configured = false;

export function setupCustomerApi(onUnauthorized?: () => void): void {
  if (configured) return;
  configured = true;

  configureCustomerApi({
    getToken: () => {
      // Synchronous token provider — AuthContext keeps in-memory cache synced.
      return inMemoryToken;
    },
    onUnauthorized: () => {
      void clearSecureSession();
      inMemoryToken = null;
      onUnauthorized?.();
    },
  });
}

let inMemoryToken: string | null = null;

export function setInMemoryToken(token: string | null): void {
  inMemoryToken = token;
}

export async function syncTokenFromSecureStore(): Promise<string | null> {
  const token = await getAccessToken();
  inMemoryToken = token;
  return token;
}
