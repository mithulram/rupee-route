import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';
import { ScreenLayout } from '../../src/components/ScreenLayout';
import { t } from '../../src/lib/i18n';

export default function CouponsTab() {
  return (
    <ScreenLayout testID="coupons-tab">
      <ScrollView contentContainerStyle={styles.container}>
        <Text
          accessibilityRole="header"
          allowFontScaling
          maxFontSizeMultiplier={2}
          style={styles.title}
        >
          {t('couponTitle')}
        </Text>
        <View style={styles.card}>
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.empty}>
            {t('couponEmpty')}
          </Text>
          <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.hint}>
            {t('couponHint')}
          </Text>
        </View>
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
  card: {
    backgroundColor: tokens.color.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  empty: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  hint: {
    fontSize: 14,
    color: tokens.color.textSecondary,
  },
});
