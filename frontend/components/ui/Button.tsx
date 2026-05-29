import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useFontScale } from '@/hooks/useFontScale';
import { useUiStore } from '@/store/uiStore';
import { useWindowDimensions } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'secondary' | 'danger';
  stretch?: boolean;
};

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = 'primary',
  stretch = false,
}: ButtonProps) {
  const appPalette = useAppPalette();
  const fontScale = useFontScale();
  const { width } = useWindowDimensions();
  const highContrastMode = useUiStore((state) => state.highContrastMode);
  const palette = highContrastMode ? contrastTones(appPalette)[tone] : tones[tone];
  const isCompact = width < 380;
  const isTablet = width >= 768;
  const buttonMinHeight = isCompact ? 48 : isTablet ? 56 : 52;
  const buttonPaddingHorizontal = isCompact ? 16 : isTablet ? 24 : 18;
  const buttonPaddingVertical = isCompact ? 12 : 14;
  const labelSize = (isCompact ? 15 : isTablet ? 17 : 16) * fontScale;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: stretch ? '100%' : undefined,
          backgroundColor: palette.backgroundColor,
          opacity: pressed ? 0.88 : 1,
          minHeight: buttonMinHeight,
          paddingHorizontal: buttonPaddingHorizontal,
          paddingVertical: buttonPaddingVertical,
          borderRadius: isTablet ? 16 : 14,
        },
        disabled || loading ? styles.disabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <Text style={[styles.label, { color: palette.textColor, fontSize: labelSize }]}>{label}</Text>
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
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
});
