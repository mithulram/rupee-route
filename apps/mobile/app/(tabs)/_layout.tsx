import { Tabs, Redirect } from 'expo-router';
import { tokens } from '@rupeeroute/design-system';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.brandSecondary,
        tabBarInactiveTintColor: tokens.color.textSecondary,
        tabBarStyle: {
          borderTopColor: tokens.color.borderDefault,
          backgroundColor: tokens.color.surfaceDefault,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarAccessibilityLabel: 'Activity tab',
        }}
      />
      <Tabs.Screen
        name="recipients"
        options={{
          title: 'Recipients',
          tabBarAccessibilityLabel: 'Recipients tab',
        }}
      />
      <Tabs.Screen
        name="coupons"
        options={{
          title: 'Coupons',
          tabBarAccessibilityLabel: 'Coupons tab',
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help',
          tabBarAccessibilityLabel: 'Help tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
    </Tabs>
  );
}
