/**
 * AnimatedSplashScreen — Premium animated splash with logo pulse,
 * gradient background, and progress bar. Fades out once isHydrated = true.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
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
  /** When true, the splash fades out */
  visible: boolean;
};

export function AnimatedSplashScreen({ visible }: Props) {
  // Logo pulse scale
  const logoScale = useSharedValue(1);
  // Glow opacity
  const glowOpacity = useSharedValue(0.4);
  // Progress bar width (0 → width)
  const progressWidth = useSharedValue(0);
  // Root opacity for fade-out
  const rootOpacity = useSharedValue(1);

  // Local state to completely remove the component from the DOM when finished
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Logo pulse
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 900 }),
        withTiming(0.3, { duration: 900 })
      ),
      -1,
      false
    );

    // Progress bar fills to 80% quickly, then waits for hydration
    progressWidth.value = withTiming(width * 0.78, {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
  }, [glowOpacity, logoScale, progressWidth]);

  useEffect(() => {
    if (!visible) {
      // Complete progress bar then fade out
      progressWidth.value = withTiming(width - 80, { duration: 300 }, () => {
        rootOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
          if (finished) {
            runOnJS(setIsFinished)(true);
          }
        });
      });
    }
  }, [visible, progressWidth, rootOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
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
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
    >
      <LinearGradient
        colors={['#0a0f1e', '#111827', '#0f1c2a']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Glow halo behind logo */}
        <Animated.View style={[styles.glow, glowStyle]} />

        {/* Logo ring */}
        <Animated.View style={[styles.logoRing, logoStyle]}>
          <LinearGradient
            colors={['#0d9488', '#14b8a6']}
            style={styles.logoGradient}
          >
            <Ionicons name="fitness" size={44} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Wordmark */}
        <Text style={styles.eyebrow}>AI POWERED</Text>
        <Text style={styles.appName}>FITRACK</Text>
        <Text style={styles.tagline}>Your Premium Fitness Coach</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={['#0d9488', '#14b8a6', '#2dd4bf']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        <Text style={styles.loadingLabel}>Initializing…</Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Powered by AI • Secured with JWT</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 0,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0d9488',
    top: -10,
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 0,
    filter: undefined, // not supported in RN, using shadow
  },
  logoRing: {
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#2dd4bf',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appName: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 48,
  },
  progressTrack: {
    width: width - 80,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 12,
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
