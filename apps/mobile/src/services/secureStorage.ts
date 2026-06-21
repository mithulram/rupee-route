import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from '../lib/constants';
import type { UserProfile } from '@rupeeroute/api-contracts';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEYS.accessToken);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.accessToken, token);
}

export async function clearAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEYS.accessToken);
}

export async function getStoredProfile(): Promise<UserProfile | null> {
  const raw = await SecureStore.getItemAsync(SECURE_KEYS.userProfile);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function setStoredProfile(profile: UserProfile): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEYS.userProfile, JSON.stringify(profile));
}

export async function clearStoredProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEYS.userProfile);
}

export async function clearSecureSession(): Promise<void> {
  await Promise.all([clearAccessToken(), clearStoredProfile()]);
}
