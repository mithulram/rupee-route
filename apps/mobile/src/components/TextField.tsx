import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { tokens } from '@rupeeroute/design-system';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, accessibilityLabel, ...rest }: TextFieldProps) {
  const fieldId = rest.nativeID ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <View style={styles.wrapper}>
      <Text
        allowFontScaling
        maxFontSizeMultiplier={2}
        nativeID={`${fieldId}-label`}
        style={styles.label}
      >
        {label}
      </Text>
      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityLabelledBy={`${fieldId}-label`}
        allowFontScaling
        maxFontSizeMultiplier={2}
        nativeID={fieldId}
        placeholderTextColor={tokens.color.textSecondary}
        style={[styles.input, error ? styles.inputError : null]}
        {...rest}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.textPrimary,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.color.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: tokens.color.textPrimary,
    backgroundColor: tokens.color.surfaceDefault,
  },
  inputError: {
    borderColor: tokens.color.statusError,
  },
  error: {
    color: tokens.color.statusError,
    fontSize: 14,
  },
});
