import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { useDeepLinkHandler } from '../src/hooks/useDeepLink';
import { LoadingState } from '../src/components/LoadingState';

function NavigationShell() {
  const { isLoading, isAuthenticated } = useAuth();
  useDeepLinkHandler(isAuthenticated);

  if (isLoading) {
    return <LoadingState message="Starting RupeeRoute…" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="send" options={{ presentation: 'modal', headerShown: true }} />
      <Stack.Screen name="transfer/[id]" options={{ headerShown: true, title: 'Transfer' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NavigationShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
