import { Platform, type ViewStyle } from 'react-native';
import { Brand, Colors, Gradients, HighContrastColors, Radius, Shadows, Spacing } from './theme';

export { Brand, Colors, Gradients, HighContrastColors, Radius, Shadows, Spacing };

export const Layout = {
  screenPadding: Spacing.base,
  screenPaddingWide: Spacing.xl,
  sectionGap: Spacing.xl,
  contentMaxWidth: 760,
  topInset: Platform.select({ ios: 8, android: 12, default: 10 }),
  bottomInset: 24,
  headerHeight: 72,
  tabBarHeight: 72,
  tabBarBottomGap: 16,
  floatingBottomPadding: 110,
} as const;

export const Typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
} as const;

export const Surface = {
  page: {
    flex: 1,
    backgroundColor: Colors.light.background,
  } satisfies ViewStyle,
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.floatingBottomPadding,
  } satisfies ViewStyle,
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.xl,
    ...Shadows.md,
  } satisfies ViewStyle,
} as const;

export const Components = {
  button: {
    minHeight: 52,
    radius: Radius.lg,
    paddingX: Spacing.lg,
  },
  input: {
    minHeight: 52,
    radius: Radius.lg,
    paddingX: Spacing.base,
    paddingY: 13,
  },
  card: {
    radius: Radius.xl,
    padding: Spacing.base,
  },
  section: {
    gap: Spacing.base,
  },
} as const;

export const Theme = {
  Brand,
  Colors,
  HighContrastColors,
  Gradients,
  Radius,
  Shadows,
  Spacing,
  Layout,
  Typography,
  Surface,
  Components,
} as const;
