import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../lib/constants';

export type PushRegistrationState = 'unsupported' | 'placeholder' | 'registered';

export type PushNotificationStatus = {
  state: PushRegistrationState;
  token: string | null;
  message: string;
};

/**
 * Placeholder push notification service — architecture only, no live FCM/APNs wiring.
 */
export const pushNotificationService = {
  async register(): Promise<PushNotificationStatus> {
    const placeholderToken = `sandbox-placeholder-${String(Date.now())}`;
    await AsyncStorage.setItem(STORAGE_KEYS.pushToken, placeholderToken);
    return {
      state: 'placeholder',
      token: placeholderToken,
      message: 'Push notifications are not enabled in sandbox builds.',
    };
  },

  async getStatus(): Promise<PushNotificationStatus> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.pushToken);
    if (!token) {
      return {
        state: 'unsupported',
        token: null,
        message: 'Push notifications are not configured.',
      };
    }
    return {
      state: 'placeholder',
      token,
      message: 'Placeholder token stored locally — no live delivery.',
    };
  },

  async unregister(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.pushToken);
  },
};
