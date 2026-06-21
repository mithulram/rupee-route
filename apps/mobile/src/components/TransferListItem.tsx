import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TransferSummary } from '@rupeeroute/api-contracts';
import { tokens } from '@rupeeroute/design-system';
import { formatDate, formatMinorAmount, formatTransferState } from '../lib/format';

type TransferListItemProps = {
  transfer: TransferSummary;
  onPress?: () => void;
};

export function TransferListItem({ transfer, onPress }: TransferListItemProps) {
  const amountLabel =
    transfer.sourceAmountMinor && transfer.sourceCurrency
      ? formatMinorAmount(transfer.sourceAmountMinor, transfer.sourceCurrency)
      : 'Amount unavailable';

  const accessibilityLabel = `Transfer ${formatTransferState(transfer.state)}, ${amountLabel}, updated ${formatDate(transfer.updatedAt)}`;

  return (
    <Pressable
      accessibilityHint="Opens transfer details"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.main}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.amount}>
          {amountLabel}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.meta}>
          {transfer.recipientName ?? 'Recipient pending'}
        </Text>
      </View>
      <View style={styles.side}>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.state}>
          {formatTransferState(transfer.state)}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.date}>
          {formatDate(transfer.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.color.borderDefault,
  },
  pressed: {
    backgroundColor: tokens.color.surfaceMuted,
  },
  main: {
    flex: 1,
    gap: 4,
  },
  side: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
  state: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.brandSecondary,
  },
  date: {
    fontSize: 12,
    color: tokens.color.textSecondary,
  },
});
