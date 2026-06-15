import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Components, Typography } from '@/constants/designSystem';

type InputProps = TextInputProps & {
  /** Optional — when omitted the label line is hidden (for inline/custom layouts) */
  label?: string;
  error?: string | null;
};

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#6b7280"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
  },
  label: {
    color: '#0f172a',
    ...Typography.label,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: Components.input.radius,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: Typography.body.fontSize,
    flexGrow: 1,
    flexShrink: 1,
    includeFontPadding: false,
    minWidth: 0,
    paddingHorizontal: Components.input.paddingX,
    paddingVertical: Components.input.paddingY,
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  error: {
    color: '#dc2626',
    ...Typography.caption,
    marginTop: 6,
  },
});
