/**
 * GradientCard — Glassmorphism card with optional gradient border.
 * Use across analysis results, onboarding, and feature highlights.
 */

import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  /** Show a glowing teal gradient border */
  glowBorder?: boolean;
  /** Dark glass variant */
  dark?: boolean;
};

export function GradientCard({ children, style, innerStyle, glowBorder = false, dark = false }: Props) {
  if (glowBorder) {
    return (
      <LinearGradient
        colors={['#0d9488', '#14b8a6', '#0f766e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.borderGradient, style]}
      >
        <View style={[dark ? styles.innerDark : styles.innerLight, innerStyle]}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[dark ? styles.cardDark : styles.cardLight, style, innerStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  borderGradient: {
    borderRadius: 24,
    padding: 1.5,
  },
  innerLight: {
    backgroundColor: '#ffffff',
    borderRadius: 23,
    overflow: 'hidden',
  },
  innerDark: {
    backgroundColor: '#0f172a',
    borderRadius: 23,
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
});
