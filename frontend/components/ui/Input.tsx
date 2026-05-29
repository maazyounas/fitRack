import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    flexGrow: 1,
    flexShrink: 1,
    includeFontPadding: false,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 6,
  },
});
