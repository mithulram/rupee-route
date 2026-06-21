import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { ApiError } from '@rupeeroute/api-contracts';
import { Button } from '../src/components/Button';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { TextField } from '../src/components/TextField';
import { useAuth } from '../src/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState<'DE' | 'CH'>('DE');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, countryCode);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : 'Registration failed. Email may already be in use.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout testID="register-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text
            accessibilityRole="header"
            allowFontScaling
            maxFontSizeMultiplier={2}
            style={styles.title}
          >
            Create sandbox account
          </Text>
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            textContentType="emailAddress"
            value={email}
          />
          <TextField
            autoComplete="password-new"
            label="Password"
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            value={password}
          />
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Send country"
            style={styles.countryGroup}
          >
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.label}>
              Send country
            </Text>
            {(
              [
                ['DE', 'Germany (EUR)'],
                ['CH', 'Switzerland (CHF)'],
              ] as const
            ).map(([code, label]) => (
              <Pressable
                key={code}
                accessibilityRole="radio"
                accessibilityState={{ selected: countryCode === code }}
                onPress={() => {
                  setCountryCode(code);
                }}
                style={[styles.countryOption, countryCode === code ? styles.countrySelected : null]}
              >
                <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.countryLabel}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {error ? (
            <Text
              accessibilityRole="alert"
              allowFontScaling
              maxFontSizeMultiplier={2}
              style={styles.error}
            >
              {error}
            </Text>
          ) : null}
          <Button
            disabled={submitting || !email || password.length < 8}
            label={submitting ? 'Creating account…' : 'Register'}
            onPress={() => {
              void onSubmit();
            }}
          />
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.footer}>
            Already registered?{' '}
            <Link accessibilityRole="link" href="/login" style={styles.link}>
              Sign in
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  countryGroup: {
    gap: 8,
  },
  countryOption: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  countrySelected: {
    borderColor: tokens.color.brandSecondary,
    backgroundColor: tokens.color.surfaceMuted,
  },
  countryLabel: {
    fontSize: 16,
    color: tokens.color.textPrimary,
  },
  error: {
    color: tokens.color.statusError,
    fontSize: 14,
  },
  footer: {
    fontSize: 15,
    color: tokens.color.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  link: {
    color: tokens.color.brandSecondary,
    fontWeight: '600',
  },
});
