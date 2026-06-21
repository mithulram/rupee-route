import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { customerApi, newIdempotencyKey, type RecipientResponse } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { useSendDraft } from '../../src/hooks/useSendDraft';

export default function SendRecipientScreen() {
  const router = useRouter();
  const { draft, persist } = useSendDraft();
  const [recipients, setRecipients] = useState<RecipientResponse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(draft?.recipientId ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await customerApi.listRecipients();
      setRecipients(list);
    } catch {
      setError('Unable to load recipients.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!draft?.transferId) {
      router.replace('/send/amount');
      return;
    }
    void load();
  }, [draft?.transferId, load, router]);

  async function onContinue() {
    if (!draft?.transferId || !selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await customerApi.attachRecipient(draft.transferId, selectedId, newIdempotencyKey());
      await persist({
        ...draft,
        step: 'review',
        recipientId: selectedId,
      });
      router.push('/send/review');
    } catch {
      setError('Unable to attach recipient to transfer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading recipients…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="send-recipient-screen">
      <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.subtitle}>
        Select who should receive this sandbox transfer.
      </Text>
      <FlatList
        contentContainerStyle={styles.list}
        data={recipients}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.empty}>
            Add a recipient from the Recipients tab first.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: selectedId === item.id }}
            onPress={() => {
              setSelectedId(item.id);
            }}
            style={[styles.row, selectedId === item.id ? styles.selected : null]}
          >
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.name}>
              {item.displayName}
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.meta}>
              {item.accountHolder}
            </Text>
          </Pressable>
        )}
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
        disabled={!selectedId || submitting}
        label={submitting ? 'Saving…' : 'Continue to review'}
        onPress={() => {
          void onContinue();
        }}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    color: tokens.color.textSecondary,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 16,
  },
  row: {
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 4,
  },
  selected: {
    borderColor: tokens.color.brandSecondary,
    backgroundColor: tokens.color.surfaceMuted,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  empty: {
    fontSize: 15,
    color: tokens.color.textSecondary,
    paddingVertical: 24,
  },
  error: {
    color: tokens.color.statusError,
    marginBottom: 8,
  },
});
