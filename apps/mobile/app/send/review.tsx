import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { customerApi, newIdempotencyKey, type TransferDetail } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { useBiometricAuth } from '../../src/hooks/useBiometricAuth';
import { useSendDraft } from '../../src/hooks/useSendDraft';
import { formatMinorAmount, formatTransferState } from '../../src/lib/format';

export default function SendReviewScreen() {
  const router = useRouter();
  const { draft, reset } = useSendDraft();
  const { authenticate, capability } = useBiometricAuth();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft?.transferId) {
      router.replace('/send/amount');
      return;
    }
    void customerApi
      .getTransfer(draft.transferId)
      .then(setTransfer)
      .catch(() => {
        setError('Unable to load transfer details.');
      });
  }, [draft?.transferId, router]);

  async function onConfirm() {
    if (!draft?.transferId) return;
    setError(null);
    const verified = await authenticate('Confirm this sandbox transfer');
    if (!verified) {
      setError(`Biometric verification required (${capability.label}).`);
      return;
    }

    setSubmitting(true);
    try {
      const confirmed = await customerApi.confirmTransfer(draft.transferId, newIdempotencyKey());
      await reset();
      router.replace(`/send/tracking?id=${confirmed.id}`);
    } catch {
      setError('Unable to confirm transfer in sandbox.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!transfer) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading review…" />
      </ScreenLayout>
    );
  }

  const quote = transfer.quote;

  return (
    <ScreenLayout testID="send-review-screen">
      <ScrollView contentContainerStyle={styles.container}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.title}>
          Review and confirm
        </Text>
        <View style={styles.card}>
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
            Status: {formatTransferState(transfer.state)}
          </Text>
          {quote ? (
            <>
              <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
                Send: {formatMinorAmount(quote.sourceAmountMinor, transfer.sourceCurrency ?? 'EUR')}
              </Text>
              <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
                Receive: {formatMinorAmount(quote.targetAmountMinor, 'INR')}
              </Text>
              <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.disclosure}>
                {quote.marginDisclosure}
              </Text>
            </>
          ) : null}
        </View>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.note}>
          Sandbox transfers do not move real money. Confirmation advances the transfer in the demo
          environment only.
        </Text>
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
          disabled={submitting}
          label={submitting ? 'Confirming…' : 'Confirm transfer'}
          onPress={() => {
            void onConfirm();
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.color.textPrimary,
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
  },
  note: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  error: {
    color: tokens.color.statusError,
  },
});
