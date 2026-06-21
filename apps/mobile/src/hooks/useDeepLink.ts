import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';

function mapDeepLinkToPath(url: string): Href | null {
  const parsed = Linking.parse(url);
  const hostname = parsed.hostname ?? '';
  const path = parsed.path ?? '';

  if (hostname === 'send' || path === 'send' || path.startsWith('send/')) {
    return '/send/amount';
  }

  if (hostname === 'transfer' && path) {
    return `/transfer/${path.replace(/^\//, '')}` as Href;
  }

  const transferMatch = /^(\/?transfer\/([^/]+))$/.exec(path);
  if (transferMatch?.[2]) {
    return `/transfer/${transferMatch[2]}` as Href;
  }

  const idParam = parsed.queryParams?.id;
  if (typeof idParam === 'string') {
    return `/transfer/${idParam}` as Href;
  }

  return null;
}

export function useDeepLinkHandler(isAuthenticated: boolean) {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string) => {
      const target = mapDeepLinkToPath(url);
      if (!target) return;
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
      router.push(target);
    };

    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, router]);
}
