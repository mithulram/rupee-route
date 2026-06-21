import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { ApiError } from '@rupeeroute/api-contracts';
import { Button } from '../src/components/Button';
import { ScreenLayout } from '../src/components/ScreenLayout';
import { TextField } from '../src/components/TextField';
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to sign in. Check your sandbox credentials.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout testID="login-screen">
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
            Sign in
          </Text>
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.subtitle}>
            Access your sandbox RupeeRoute account.
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
            autoComplete="password"
            label="Password"
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            value={password}
          />
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
            accessibilityHint="Signs in to your sandbox account"
            disabled={submitting || !email || password.length < 8}
            label={submitting ? 'Signing in…' : 'Sign in'}
            onPress={() => {
              void onSubmit();
            }}
          />
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.footer}>
            No account?{' '}
            <Link accessibilityRole="link" href="/register" style={styles.link}>
              Register
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
  },
  subtitle: {
    fontSize: 16,
    color: tokens.color.textSecondary,
    marginBottom: 8,
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
