/**
 * PremiumButton — Improved modern UI button
 * ✔ Better spacing & typography
 * ✔ Smooth spring animation
 * ✔ Disabled state
 * ✔ Icon alignment
 * ✔ Better shadows/elevation
 * ✔ Cleaner ghost & secondary variants
 * ✔ More polished gradients
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
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

const GRADIENT_MAPS: Record<Tone, readonly [string, string]> = {
  primary: ['#14b8a6', '#0f766e'],
  danger: ['#f43f5e', '#be123c'],
  secondary: ['#ffffff', '#ffffff'],
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

  const isDisabled = disabled || loading;
  const isLight = tone === 'secondary' || tone === 'ghost';

  const heights = {
    sm: 42,
    md: 50,
    lg: 58,
  };

  const fontSizes = {
    sm: 14,
    md: 15,
    lg: 16,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 14,
      stiffness: 220,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 14,
      stiffness: 220,
    });
  };

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={GRADIENT_MAPS[tone]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.button,
          {
            height: heights[size],
          },
          tone === 'secondary' && styles.secondaryButton,
          tone === 'ghost' && styles.ghostButton,
          tone === 'danger' && styles.dangerShadow,
          tone === 'primary' && styles.primaryShadow,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isLight ? '#0f766e' : '#ffffff'}
          />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.label,
                {
                  fontSize: fontSizes[size],
                  color: isLight ? '#0f766e' : '#ffffff',
                },
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
  button: {
    minWidth: 140,
    borderRadius: 18,
    paddingHorizontal: 22,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 10,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 6,
        },
      },
      android: {
        elevation: 5,
      },
    }),
  },

  primaryShadow: {
    shadowColor: '#0f766e',
  },

  dangerShadow: {
    shadowColor: '#be123c',
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(13,148,136,0.25)',
    backgroundColor: '#ffffff',
  },

  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.15)',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },

  label: {
    fontWeight: '700',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
});