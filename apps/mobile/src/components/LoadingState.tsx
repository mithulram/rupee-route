import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <ActivityIndicator
        accessibilityLabel="Loading"
        color={tokens.color.brandSecondary}
        size="large"
      />
      <Text allowFontScaling maxFontSizeMultiplier={2} style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: tokens.color.textSecondary,
  },
});
