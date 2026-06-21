import { Text, View } from 'react-native';
import { tokens } from '@rupeeroute/design-system';

export function SandboxBanner() {
  return (
    <View
      accessibilityLabel="Sandbox mode. No real money movement."
      accessibilityRole="text"
      testID="sandbox-banner"
      style={{
        backgroundColor: tokens.color.sandboxBanner,
        padding: 8,
        borderRadius: 6,
        marginHorizontal: 12,
        marginTop: 8,
        marginBottom: 8,
      }}
    >
      <Text
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={{ color: tokens.color.sandboxBannerText, fontSize: 12, textAlign: 'center' }}
      >
        Sandbox — no real money movement
      </Text>
    </View>
  );
}
