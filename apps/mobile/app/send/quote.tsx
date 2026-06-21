import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { customerApi, newIdempotencyKey, type QuoteResponse } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { useSendDraft } from '../../src/hooks/useSendDraft';
import { formatMinorAmount } from '../../src/lib/format';

export default function SendQuoteScreen() {
  const router = useRouter();
  const { draft, persist } = useSendDraft();
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!draft?.sourceAmountMinor) {
      router.replace('/send/amount');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const created = await customerApi.createQuote(
          {
            sourceCurrency: draft.sourceCurrency,
            sourceAmountMinor: draft.sourceAmountMinor,
            couponCode: draft.couponCode,
          },
          newIdempotencyKey(),
        );
        if (cancelled) return;
        setQuote(created);
        await persist({
          ...draft,
          step: 'quote',
          quoteId: created.id,
        });
      } catch {
        if (!cancelled) {
          setError('Unable to fetch quote. Check your connection and try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draft, persist, router]);

  async function onContinue() {
    if (!quote || !draft) return;
    setSubmitting(true);
    setError(null);
    try {
      const transfer = await customerApi.createTransfer(quote.id, newIdempotencyKey());
      await persist({
        ...draft,
        step: 'recipient',
        quoteId: quote.id,
        transferId: transfer.id,
      });
      router.push('/send/recipient');
    } catch {
      setError('Unable to create transfer draft.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!draft) {
    return (
      <ScreenLayout>
        <LoadingState />
      </ScreenLayout>
    );
  }

  if (!quote && !error) {
    return (
      <ScreenLayout>
        <LoadingState message="Fetching live sandbox quote…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="send-quote-screen">
      <ScrollView contentContainerStyle={styles.container}>
        {quote ? (
          <View style={styles.card}>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              You send: {formatMinorAmount(quote.sourceAmountMinor, quote.sourceCurrency)}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              They receive: {formatMinorAmount(quote.targetAmountMinor, quote.targetCurrency)}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              Rate: 1 {quote.sourceCurrency} = {quote.customerRate} INR
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.disclosure}>
              {quote.marginDisclosure}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.meta}>
              Quote expires {new Date(quote.expiresAt).toLocaleString()}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.meta}>
              {quote.deliveryEstimate}
            </Text>
          </View>
        ) : null}
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
          disabled={!quote || submitting}
          label={submitting ? 'Creating draft…' : 'Continue to recipient'}
          onPress={() => {
            void onContinue();
          }}
        />
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
  card: {
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  row: {
    fontSize: 16,
    color: tokens.color.textPrimary,
  },
  disclosure: {
    fontSize: 14,
    color: tokens.color.textSecondary,
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: tokens.color.textSecondary,
  },
  error: {
    color: tokens.color.statusError,
  },
});
