import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useFontScale } from '@/hooks/useFontScale';
import { useUiStore } from '@/store/uiStore';

type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
};

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
}: ButtonProps) {
  const appPalette = useAppPalette();
  const fontScale = useFontScale();
  const highContrastMode = useUiStore((state) => state.highContrastMode);
  const palette = highContrastMode ? contrastTones(appPalette)[tone] : tones[tone];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.backgroundColor, opacity: pressed ? 0.88 : 1 },
        disabled || loading ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <Text style={[styles.label, { color: palette.textColor, fontSize: 16 * fontScale }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const tones = {
  primary: { backgroundColor: '#0f766e', textColor: '#f8fafc' },
  secondary: { backgroundColor: '#e2e8f0', textColor: '#0f172a' },
  danger: { backgroundColor: '#b91c1c', textColor: '#fff' },
};

function contrastTones(appPalette: { tint: string; text: string; background: string }) {
  return {
    primary: { backgroundColor: appPalette.tint, textColor: appPalette.background },
    secondary: { backgroundColor: appPalette.background, textColor: appPalette.text },
    danger: { backgroundColor: '#7f1d1d', textColor: '#ffffff' },
  };
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
