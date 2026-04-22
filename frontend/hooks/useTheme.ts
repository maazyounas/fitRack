import { useUiStore } from '@/store/uiStore';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeOverride = useUiStore((state) => state.themeOverride);

  return themeOverride ?? systemTheme;
}
