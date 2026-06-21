import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { customerApi, type TransferDetail } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { formatDate, formatMinorAmount, formatTransferState } from '../../src/lib/format';

export default function SendTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void customerApi
      .getTransfer(String(id))
      .then(setTransfer)
      .catch(() => {
        setError('Unable to load transfer status.');
      });
  }, [id]);

  if (!id) {
    return (
      <ScreenLayout>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.error}>
          Missing transfer id.
        </Text>
      </ScreenLayout>
    );
  }

  if (!transfer && !error) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading transfer status…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="send-tracking-screen">
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          accessibilityRole="header"
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={styles.title}
        >
          Transfer submitted
        </Text>
        {transfer ? (
          <View style={styles.card}>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
              State: {formatTransferState(transfer.state)}
            </Text>
            {transfer.quote ? (
              <>
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
              </>
            ) : null}
            {transfer.fundingReference ? (
              <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.row}>
                Funding reference: {transfer.fundingReference}
              </Text>
            ) : null}
            {transfer.message ? (
              <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.note}>
                {transfer.message}
              </Text>
            ) : null}
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.meta}>
              Updated {formatDate(transfer.updatedAt)}
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
          label="View transfer details"
          onPress={() => {
            router.replace(`/transfer/${String(id)}`);
          }}
          variant="secondary"
        />
        <Button
          label="Back to home"
          onPress={() => {
            router.replace('/(tabs)');
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
    fontSize: 22,
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
  note: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  meta: {
    fontSize: 13,
    color: tokens.color.textSecondary,
  },
  error: {
    color: tokens.color.statusError,
  },
});
