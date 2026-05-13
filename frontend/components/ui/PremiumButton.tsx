/**
 * PremiumButton — Gradient button with Reanimated press-scale animation.
 * Drop-in for new screens. Existing Button.tsx is preserved.
 */

import { Pressable, StyleSheet, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type Tone = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
};

const GRADIENT_MAPS: Record<string, readonly [string, string, ...string[]]> = {
  primary: ['#0d9488', '#0f766e'],
  danger: ['#e11d48', '#f43f5e'],
  secondary: ['rgba(15,23,42,0.06)', 'rgba(15,23,42,0.06)'],
  ghost: ['transparent', 'transparent'],
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PremiumButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  tone = 'primary',
  size = 'lg',
  style,
  textStyle,
  icon,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  const heights: Record<string, number> = { sm: 40, md: 48, lg: 56 };
  const fontSizes: Record<string, number> = { sm: 13, md: 14, lg: 16 };

  const isLight = tone === 'secondary' || tone === 'ghost';

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 10, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
      style={[animStyle, { opacity: isDisabled ? 0.55 : 1 }, style]}
    >
      <LinearGradient
        colors={GRADIENT_MAPS[tone]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.base,
          { height: heights[size], borderRadius: 16 },
          isLight && styles.lightBorder,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isLight ? '#0f766e' : '#fff'} size="small" />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.label,
                { fontSize: fontSizes[size], color: isLight ? '#0f766e' : '#fff' },
                textStyle,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
  lightBorder: {
    borderWidth: 1.5,
    borderColor: '#0d9488',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
