import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { Button } from '../../src/components/Button';
import { LoadingState } from '../../src/components/LoadingState';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { TransferListItem } from '../../src/components/TransferListItem';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSendDraft } from '../../src/hooks/useSendDraft';
import { useTransferHistory } from '../../src/hooks/useTransferHistory';

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { transfers, isLoading } = useTransferHistory();
  const { draft, isLoading: draftLoading, resumePath } = useSendDraft();

  if (isLoading || draftLoading) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading dashboard…" />
      </ScreenLayout>
    );
  }

  const recent = transfers.slice(0, 3);

  return (
    <ScreenLayout testID="home-tab">
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          accessibilityRole="header"
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={styles.title}
        >
          Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.subtitle}>
          Send EUR or CHF to India in sandbox mode. Delivery times vary by transfer status.
        </Text>

        <Button
          accessibilityHint="Starts a new sandbox transfer"
          label="Send money"
          onPress={() => {
            router.push('/send/amount');
          }}
        />

        {draft && resumePath ? (
          <View style={styles.resumeCard}>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.resumeTitle}>
              Resume your transfer
            </Text>
            <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.resumeBody}>
              You have an in-progress send draft. Continue where you left off.
            </Text>
            <Button
              label="Continue send"
              onPress={() => {
                router.push(resumePath as '/send/amount');
              }}
              variant="secondary"
            />
          </View>
        ) : null}

        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.sectionTitle}>
          Recent activity
        </Text>
        {recent.length === 0 ? (
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.empty}>
            No transfers yet. Start your first sandbox send.
          </Text>
        ) : (
          recent.map((transfer) => (
            <TransferListItem
              key={transfer.id}
              onPress={() => {
                router.push(`/transfer/${transfer.id}`);
              }}
              transfer={transfer}
            />
          ))
        )}
        {transfers.length > 3 ? (
          <Button
            label="View all activity"
            onPress={() => {
              router.push('/(tabs)/activity');
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: tokens.color.textSecondary,
  },
  resumeCard: {
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.color.textPrimary,
  },
  resumeBody: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginTop: 8,
  },
  empty: {
    fontSize: 15,
    color: tokens.color.textSecondary,
  },
});
