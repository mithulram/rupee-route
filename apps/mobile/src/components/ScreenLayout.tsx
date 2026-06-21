import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@rupeeroute/design-system';
import { SandboxBanner } from './SandboxBanner';

type ScreenLayoutProps = ViewProps & {
  children: React.ReactNode;
  testID?: string;
};

export function ScreenLayout({ children, style, testID, ...rest }: ScreenLayoutProps) {
  return (
    <SafeAreaView
      accessibilityLabel="RupeeRoute screen"
      edges={['top', 'bottom']}
      style={styles.safe}
      testID={testID}
    >
      <SandboxBanner />
      <View style={[styles.content, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: tokens.color.surfaceDefault,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
