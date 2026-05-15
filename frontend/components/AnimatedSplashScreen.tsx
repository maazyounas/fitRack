/**
 * Premium Animated Splash Screen
 * ✔ Modern glassmorphism UI
 * ✔ Smooth logo pulse
 * ✔ Floating animation
 * ✔ Better gradients
 * ✔ Animated progress bar glow
 * ✔ Elegant typography
 * ✔ Cleaner shadows
 * ✔ Production-ready styling
 */

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type Props = {
  visible: boolean;
};

export function AnimatedSplashScreen({ visible }: Props) {
  const logoScale = useSharedValue(1);
  const logoTranslateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const progressWidth = useSharedValue(0);
  const rootOpacity = useSharedValue(1);

  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Logo breathing animation
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Floating effect
    logoTranslateY.value = withRepeat(
      withSequence(
        withTiming(-6, {
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1200 }),
        withTiming(0.35, { duration: 1200 })
      ),
      -1,
      false
    );

    // Progress animation
    progressWidth.value = withTiming(width * 0.72, {
      duration: 2200,
      easing: Easing.out(Easing.exp),
    });
  }, [glowOpacity, logoScale, logoTranslateY, progressWidth]);

  useEffect(() => {
    if (!visible) {
      progressWidth.value = withTiming(width - 90, {
        duration: 350,
      });

      rootOpacity.value = withTiming(
        0,
        {
          duration: 500,
        },
        (finished) => {
          if (finished) {
            runOnJS(setIsFinished)(true);
          }
        }
      );
    }
  }, [visible, progressWidth, rootOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { translateY: logoTranslateY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
  }));

  if (isFinished) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.root, rootStyle]}
    >
      {/* Background */}
      <LinearGradient
        colors={['#020617', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative background circles */}
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <View style={styles.content}>
        {/* Glow */}
        <Animated.View style={[styles.glow, glowStyle]} />

        {/* Logo */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <LinearGradient
            colors={['#14b8a6', '#0f766e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="fitness" size={42} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Branding */}
        <Text style={styles.eyebrow}>AI FITNESS PLATFORM</Text>

        <Text style={styles.appName}>FITRACK</Text>

        <Text style={styles.tagline}>
          Smart Training • AI Coaching • Health Tracking
        </Text>

        {/* Progress */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={['#14b8a6', '#2dd4bf', '#5eead4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.loadingText}>
          Initializing Experience...
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Powered by AI • Secure Authentication • Real-time Sync
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  circleTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: 'rgba(20,184,166,0.08)',
  },

  circleBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 200,
    backgroundColor: 'rgba(45,212,191,0.06)',
  },

  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#14b8a6',

    shadowColor: '#14b8a6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 70,

    opacity: 0.5,
  },

  logoWrapper: {
    marginBottom: 30,

    shadowColor: '#14b8a6',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.45,
    shadowRadius: 30,

    elevation: 18,
  },

  logoGradient: {
    width: 92,
    height: 92,
    borderRadius: 30,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  eyebrow: {
    color: '#2dd4bf',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 10,
  },

  appName: {
    color: '#ffffff',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 6,

    marginBottom: 12,
  },

  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,

    marginBottom: 50,
    paddingHorizontal: 20,
  },

  progressTrack: {
    width: width - 90,
    height: 6,
    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',

    marginBottom: 14,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },

  loadingText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 30,

    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    letterSpacing: 0.6,
  },
});