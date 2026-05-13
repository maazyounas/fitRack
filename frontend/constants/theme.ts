/**
 * FitRack Premium Design System
 * Extended color palette, spacing, radius, shadow and typography tokens.
 */

import { Platform } from 'react-native';

// ─── Brand Palette ────────────────────────────────────────────────────────────
export const Brand = {
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
  navy: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gold: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  emerald: {
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },
  rose: {
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
  },
  electric: '#00d4ff',
  glow: 'rgba(13,148,136,0.35)',
} as const;

// ─── Semantic Colour Tokens ───────────────────────────────────────────────────
const tintColorLight = Brand.teal[700];
const tintColorDark = Brand.teal[400];

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f4f7f5',
    card: '#ffffff',
    border: '#dbe4e8',
    mutedText: '#64748b',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    surface: '#f8fafc',
    surfaceElevated: '#ffffff',
    success: Brand.emerald[500],
    warning: Brand.gold[500],
    danger: Brand.rose[500],
  },
  dark: {
    text: '#ECEDEE',
    background: '#0a0f1e',
    card: '#0f172a',
    border: '#1e293b',
    mutedText: '#94a3b8',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    surface: '#111827',
    surfaceElevated: '#1e293b',
    success: Brand.emerald[400],
    warning: Brand.gold[400],
    danger: Brand.rose[400],
  },
};

export const HighContrastColors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    card: '#ffffff',
    border: '#000000',
    mutedText: '#111111',
    tint: '#0057ff',
    icon: '#000000',
    tabIconDefault: '#000000',
    tabIconSelected: '#0057ff',
    surface: '#f5f5f5',
    surfaceElevated: '#ffffff',
    success: '#15803d',
    warning: '#b45309',
    danger: '#dc2626',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    card: '#000000',
    border: '#ffffff',
    mutedText: '#f8fafc',
    tint: '#7dd3fc',
    icon: '#ffffff',
    tabIconDefault: '#ffffff',
    tabIconSelected: '#7dd3fc',
    surface: '#111111',
    surfaceElevated: '#1a1a1a',
    success: '#4ade80',
    warning: '#fde68a',
    danger: '#fca5a5',
  },
};

// ─── Spacing Scale ────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Gradient Presets ─────────────────────────────────────────────────────────
export const Gradients = {
  primary: ['#0d9488', '#0f766e', '#115e59'] as const,
  primaryDark: ['#042f2e', '#0f766e', '#0d9488'] as const,
  splash: ['#0a0f1e', '#111827', '#0f766e'] as const,
  card: ['rgba(15,23,42,0.9)', 'rgba(13,148,136,0.15)'] as const,
  gold: ['#f59e0b', '#d97706'] as const,
  hero: ['#0d9488', '#0f766e'] as const,
  dark: ['#0f172a', '#1e293b'] as const,
  success: ['#059669', '#10b981'] as const,
  danger: ['#e11d48', '#f43f5e'] as const,
} as const;
