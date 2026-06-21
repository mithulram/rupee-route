import { describe, expect, it, vi } from 'vitest';
import * as LocalAuthentication from 'expo-local-authentication';
import { resolveBiometricCapability } from './useBiometricAuth';

describe('resolveBiometricCapability', () => {
  it('detects fingerprint hardware', async () => {
    vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
    vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const capability = await resolveBiometricCapability();
    expect(capability.isAvailable).toBe(true);
    expect(capability.label).toContain('fingerprint');
  });

  it('falls back when biometrics unavailable', async () => {
    vi.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(false);
    vi.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(false);
    vi.mocked(LocalAuthentication.supportedAuthenticationTypesAsync).mockResolvedValue([]);

    const capability = await resolveBiometricCapability();
    expect(capability.isAvailable).toBe(false);
    expect(capability.label).toBe('Device passcode');
  });
});
