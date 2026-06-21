import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBiometricAuth } from '../../src/hooks/useBiometricAuth';
import { usePushNotifications } from '../../src/hooks/usePushNotifications';
import { getLocale, setLocale, t, type Locale } from '../../src/lib/i18n';

export default function SettingsTab() {
  const { user, logout, refreshProfile } = useAuth();
  const { capability } = useBiometricAuth();
  const { status, registerPlaceholder, unregister } = usePushNotifications();
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  function switchLocale(next: Locale) {
    setLocale(next);
    setLocaleState(next);
  }

  return (
    <ScreenLayout testID="settings-tab">
      <Text
        accessibilityRole="header"
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={styles.title}
      >
        {t('settings')}
      </Text>
      <View style={styles.card}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.label}>
          Account
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.value}>
          {user?.email}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.value}>
          Send country: {user?.countryCode === 'CH' ? 'Switzerland (CHF)' : 'Germany (EUR)'}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.value}>
          KYC: {user?.kycStatus}
        </Text>
        <Button
          label="Refresh profile"
          onPress={() => {
            void refreshProfile();
          }}
          variant="secondary"
        />
      </View>

      <View style={styles.card}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.label}>
          {t('language')}
        </Text>
        <View style={styles.row}>
          <Button
            label="English"
            onPress={() => switchLocale('en')}
            variant={locale === 'en' ? 'primary' : 'secondary'}
          />
          <Button
            label="Deutsch"
            onPress={() => switchLocale('de')}
            variant={locale === 'de' ? 'primary' : 'secondary'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.label}>
          Security
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.value}>
          {t('biometrics')}:{' '}
          {capability.isAvailable ? capability.label : 'Passcode fallback available'}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.muted}>
          Required before confirming transfers and adding recipients.
        </Text>
      </View>

      <View style={styles.card}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.label}>
          Push notifications
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.value}>
          {status?.message ?? 'Checking status…'}
        </Text>
        <Button
          label="Register placeholder token"
          onPress={() => {
            void registerPlaceholder();
          }}
          variant="secondary"
        />
        <Button
          label="Clear placeholder token"
          onPress={() => {
            void unregister();
          }}
          variant="secondary"
        />
      </View>

      <Button
        accessibilityHint="Signs out and clears secure session data"
        label={t('signOut')}
        onPress={() => {
          void logout();
        }}
        variant="danger"
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  value: {
    fontSize: 15,
    color: tokens.color.textPrimary,
  },
  muted: {
    fontSize: 13,
    color: tokens.color.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
