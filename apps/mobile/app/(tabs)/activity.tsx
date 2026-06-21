import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { LoadingState } from '../../src/components/LoadingState';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { TransferListItem } from '../../src/components/TransferListItem';
import { useTransferHistory } from '../../src/hooks/useTransferHistory';

export default function ActivityTab() {
  const router = useRouter();
  const { transfers, cachedAt, isOffline, isLoading, error, refresh } = useTransferHistory();

  if (isLoading && transfers.length === 0) {
    return (
      <ScreenLayout>
        <LoadingState message="Loading transfers…" />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout testID="activity-tab">
      <Text
        accessibilityRole="header"
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={styles.title}
      >
        Activity
      </Text>
      {isOffline ? <OfflineBanner cachedAt={cachedAt} /> : null}
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
      <FlatList
        contentContainerStyle={styles.list}
        data={transfers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.empty}>
            No transfers yet.
          </Text>
        }
        refreshControl={<RefreshControl onRefresh={() => void refresh()} refreshing={isLoading} />}
        renderItem={({ item }) => (
          <TransferListItem
            onPress={() => {
              router.push(`/transfer/${item.id}`);
            }}
            transfer={item}
          />
        )}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: tokens.color.textPrimary,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    fontSize: 15,
    color: tokens.color.textSecondary,
    paddingVertical: 24,
  },
  error: {
    color: tokens.color.statusError,
    marginBottom: 12,
  },
});
