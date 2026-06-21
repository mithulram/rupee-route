import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

export type BiometricCapability = {
  isAvailable: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  label: string;
};

export async function resolveBiometricCapability(): Promise<BiometricCapability> {
  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const label = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ? 'Face ID'
    : supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ? 'Touch ID / fingerprint'
      : 'Device passcode';

  return {
    isAvailable: hardware && enrolled,
    supportedTypes,
    label,
  };
}

export function useBiometricAuth() {
  const [capability, setCapability] = useState<BiometricCapability>({
    isAvailable: false,
    supportedTypes: [],
    label: 'Device passcode',
  });

  useEffect(() => {
    void resolveBiometricCapability().then(setCapability);
  }, []);

  const authenticate = useCallback(
    async (reason: string): Promise<boolean> => {
      if (!capability.isAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          fallbackLabel: 'Use passcode',
          disableDeviceFallback: false,
        });
        return result.success;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      return result.success;
    },
    [capability.isAvailable],
  );

  return { capability, authenticate };
}
