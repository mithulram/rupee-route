import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { tokens } from '@rupeeroute/design-system';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  accessibilityHint?: string;
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  accessibilityHint,
  style,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      <Text
        allowFontScaling
        maxFontSizeMultiplier={2}
        style={[styles.label, variant === 'secondary' ? styles.secondaryLabel : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: tokens.color.brandPrimary,
  },
  secondary: {
    backgroundColor: tokens.color.surfaceMuted,
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
  },
  danger: {
    backgroundColor: tokens.color.statusError,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: tokens.color.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryLabel: {
    color: tokens.color.textPrimary,
  },
});
