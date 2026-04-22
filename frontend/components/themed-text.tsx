import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useFontScale } from '@/hooks/useFontScale';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const fontScale = useFontScale();
  const scaledStyles = {
    default: { fontSize: 16 * fontScale, lineHeight: 24 * fontScale },
    defaultSemiBold: { fontSize: 16 * fontScale, lineHeight: 24 * fontScale },
    title: { fontSize: 32 * fontScale, lineHeight: 32 * fontScale },
    subtitle: { fontSize: 20 * fontScale },
    link: { fontSize: 16 * fontScale, lineHeight: 30 * fontScale },
  };

  return (
    <Text
      style={[
        { color },
        type === 'default' ? [styles.default, scaledStyles.default] : undefined,
        type === 'title' ? [styles.title, scaledStyles.title] : undefined,
        type === 'defaultSemiBold' ? [styles.defaultSemiBold, scaledStyles.defaultSemiBold] : undefined,
        type === 'subtitle' ? [styles.subtitle, scaledStyles.subtitle] : undefined,
        type === 'link' ? [styles.link, scaledStyles.link] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
