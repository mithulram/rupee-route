import { useEffect, useState } from 'react';
import {
  pushNotificationService,
  type PushNotificationStatus,
} from '../services/pushNotificationService';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushNotificationStatus | null>(null);

  useEffect(() => {
    void pushNotificationService.getStatus().then(setStatus);
  }, []);

  const registerPlaceholder = async () => {
    const next = await pushNotificationService.register();
    setStatus(next);
    return next;
  };

  const unregister = async () => {
    await pushNotificationService.unregister();
    setStatus({
      state: 'unsupported',
      token: null,
      message: 'Push notifications are not configured.',
    });
  };

  return { status, registerPlaceholder, unregister };
}
