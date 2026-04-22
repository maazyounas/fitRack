import { useTheme } from '@/hooks/useTheme';
import { Colors, HighContrastColors } from '@/constants/theme';
import { useUiStore } from '@/store/uiStore';

export function useAppPalette() {
  const theme = useTheme();
  const highContrastMode = useUiStore((state) => state.highContrastMode);
  const palette = highContrastMode ? HighContrastColors : Colors;

  return palette[theme];
}
