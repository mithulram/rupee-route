import { Stack } from 'expo-router';
import { tokens } from '@rupeeroute/design-system';

export default function SendLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tokens.color.surfaceDefault },
        headerTintColor: tokens.color.brandPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: tokens.color.surfaceDefault },
      }}
    >
      <Stack.Screen name="amount" options={{ title: 'Send amount' }} />
      <Stack.Screen name="quote" options={{ title: 'Review quote' }} />
      <Stack.Screen name="recipient" options={{ title: 'Choose recipient' }} />
      <Stack.Screen name="review" options={{ title: 'Confirm send' }} />
      <Stack.Screen
        name="tracking"
        options={{ title: 'Transfer status', headerBackVisible: false }}
      />
    </Stack>
  );
}
