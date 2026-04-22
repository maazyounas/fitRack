/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import React, { createContext, useContext } from 'react';

import { Colors, HighContrastColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useUiStore } from '@/store/uiStore';

type ThemeName = 'light' | 'dark';
const ThemeContext = createContext<ThemeName | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useContext(ThemeContext) ?? useTheme();
  const highContrastMode = useUiStore((state) => state.highContrastMode);
  const colorFromProps = props[theme];
  const palette = highContrastMode ? HighContrastColors : Colors;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return palette[theme][colorName];
  }
}
