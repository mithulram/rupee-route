import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSendDraft } from '../../src/hooks/useSendDraft';
import { parseMajorToMinor } from '../../src/lib/format';

export default function SendAmountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft, persist, reset } = useSendDraft();
  const defaultCurrency = user?.countryCode === 'CH' ? 'CHF' : 'EUR';
  const [sourceCurrency, setSourceCurrency] = useState<'EUR' | 'CHF'>(defaultCurrency);
  const [amount, setAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) return;
    setSourceCurrency(draft.sourceCurrency);
    const decimals = 2;
    setAmount((Number(draft.sourceAmountMinor) / 10 ** decimals).toFixed(decimals));
    setCouponCode(draft.couponCode ?? '');
  }, [draft]);

  async function onContinue() {
    setError(null);
    try {
      const sourceAmountMinor = parseMajorToMinor(amount, sourceCurrency);
      await persist({
        step: 'quote',
        sourceCurrency,
        sourceAmountMinor,
        couponCode: couponCode.trim() || undefined,
      });
      router.push('/send/quote');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enter a valid amount');
    }
  }

  return (
    <ScreenLayout testID="send-amount-screen">
      <ScrollView contentContainerStyle={styles.container}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.subtitle}>
          Enter the amount you want to send in sandbox mode.
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Source currency"
          style={styles.currencyGroup}
        >
          {(['EUR', 'CHF'] as const).map((currency) => (
            <Pressable
              key={currency}
              accessibilityRole="radio"
              accessibilityState={{ selected: sourceCurrency === currency }}
              onPress={() => {
                setSourceCurrency(currency);
              }}
              style={[
                styles.currencyOption,
                sourceCurrency === currency ? styles.currencySelected : null,
              ]}
            >
              <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.currencyLabel}>
                {currency}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextField
          keyboardType="decimal-pad"
          label={`Amount in ${sourceCurrency}`}
          onChangeText={setAmount}
          value={amount}
        />
        <TextField
          autoCapitalize="characters"
          label="Coupon code (optional)"
          onChangeText={setCouponCode}
          value={couponCode}
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
          disabled={!amount}
          label="Get quote"
          onPress={() => {
            void onContinue();
          }}
        />
        {draft ? (
          <Button
            label="Discard draft"
            onPress={() => {
              void reset();
              setAmount('');
              setCouponCode('');
            }}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: tokens.color.textSecondary,
  },
  currencyGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyOption: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySelected: {
    borderColor: tokens.color.brandSecondary,
    backgroundColor: tokens.color.surfaceMuted,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  error: {
    color: tokens.color.statusError,
  },
});
