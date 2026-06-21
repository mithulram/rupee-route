import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';

type OfflineBannerProps = {
  cachedAt: string | null;
};

export function OfflineBanner({ cachedAt }: OfflineBannerProps) {
  if (!cachedAt) return null;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Offline mode. Showing cached transfer history."
      style={styles.banner}
    >
      <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.text}>
        Offline — showing cached history from {new Date(cachedAt).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: tokens.color.statusWarning,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    color: tokens.color.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
});
