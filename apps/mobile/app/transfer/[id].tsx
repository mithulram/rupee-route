import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { customerApi, newIdempotencyKey, type TransferDetail } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { useBiometricAuth } from '../../src/hooks/useBiometricAuth';
import { formatDate, formatMinorAmount, formatTransferState } from '../../src/lib/format';

export default function TransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { authenticate } = useBiometricAuth();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void customerApi.getTransfer(String(id)).then(setTransfer);
  }, [id]);

  async function onCancel() {
    if (!transfer) return;
    const verified = await authenticate('Cancel this sandbox transfer');
    if (!verified) {
      setError('Biometric verification required to cancel.');
      return;
    }
    try {
      const updated = await customerApi.cancelTransfer(transfer.id, newIdempotencyKey());
      setTransfer(updated);
      setMessage('Transfer cancelled in sandbox.');
    } catch {
      setError('Unable to cancel transfer.');
    }
  }

  if (!transfer) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading transfer…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="transfer-detail-screen">
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          accessibilityRole="header"
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={styles.title}
        >
          {formatTransferState(transfer.state)}
        </Text>
        {transfer.quote ? (
          <View style={styles.card}>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              Send:{' '}
              {formatMinorAmount(
                transfer.quote.sourceAmountMinor,
                transfer.sourceCurrency ?? 'EUR',
              )}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              Receive: {formatMinorAmount(transfer.quote.targetAmountMinor, 'INR')}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              Rate: {transfer.quote.customerRate}
            </Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.section}>
            Timeline
          </Text>
          {transfer.stateHistory.map(
            (entry: TransferDetail['stateHistory'][number], index: number) => (
              <Text
                key={`${entry.occurredAt}-${String(index)}`}
                allowFontScaling
                maxFontSizeMultiplier={2}
                style={styles.history}
              >
                {formatDate(entry.occurredAt)} — {formatTransferState(entry.toState)}
              </Text>
            ),
          )}
        </View>
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            allowFontScaling
            maxFontSizeMultiplier={2}
            style={styles.message}
          >
            {message}
          </Text>
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
        {transfer.state === 'draft' ||
        transfer.state === 'quote_created' ||
        transfer.state === 'recipient_validated' ||
        transfer.state === 'funding_pending' ? (
          <Button label="Cancel transfer" onPress={() => void onCancel()} variant="danger" />
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
  title: {
    fontSize: 24,
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
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  history: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  message: {
    color: tokens.color.statusSuccess,
  },
  error: {
    color: tokens.color.statusError,
  },
});
