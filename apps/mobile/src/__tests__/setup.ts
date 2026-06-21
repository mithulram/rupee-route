/* eslint-disable @typescript-eslint/no-require-imports */
import { vi } from 'vitest';

vi.mock('react-native', () => require('react-native-web'));

vi.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(async () => false),
  isEnrolledAsync: vi.fn(async () => false),
  supportedAuthenticationTypesAsync: vi.fn(async () => []),
  authenticateAsync: vi.fn(async () => ({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

vi.mock('expo-linking', () => ({
  parse: vi.fn(),
  getInitialURL: vi.fn(async () => null),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
}));
