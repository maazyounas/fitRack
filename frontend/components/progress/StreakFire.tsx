import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface StreakFireProps {
  streak: number;
  showConfetti?: boolean;
  onPress?: () => void;
  fullWidth?: boolean;
}

export function StreakFire({ streak, showConfetti = false, onPress, fullWidth = false }: StreakFireProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const fireOffset = useSharedValue(0);

  useEffect(() => {
    // Continuous flame animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800 }),
        withTiming(0.95, { duration: 800 })
      ),
      -1,
      true
    );

    // Subtle rotation for dynamic feel
    rotate.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 1200 }),
        withTiming(-5, { duration: 1200 })
      ),
      -1,
      true
    );

    // Pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.2, { duration: 1000 })
      ),
      -1,
      true
    );

    // Vertical floating animation
    fireOffset.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1500 }),
        withTiming(3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedFlameStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${interpolate(rotate.value, [-5, 5], [-5, 5], Extrapolate.CLAMP)}deg` },
      { translateY: fireOffset.value }
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your journey today! 🔥";
    if (streak < 3) return "Keep going! You're building momentum 💪";
    if (streak < 7) return "Getting warmer! Stay consistent 🏃";
    if (streak < 14) return "On fire! Don't stop now 🔥";
    if (streak < 30) return "Incredible dedication! 🔥🔥";
    return "Legendary streak! You're unstoppable! 👑";
  };

  const getStreakColor = (streak: number) => {
    if (streak < 3) return ['#f97316', '#ea580c'];
    if (streak < 7) return ['#f59e0b', '#d97706'];
    if (streak < 14) return ['#ef4444', '#dc2626'];
    return ['#dc2626', '#b91c1c'];
  };

  const getNextMilestone = (streak: number) => {
    if (streak < 3) return { target: 3, message: "3 days" };
    if (streak < 7) return { target: 7, message: "1 week" };
    if (streak < 14) return { target: 14, message: "2 weeks" };
    if (streak < 30) return { target: 30, message: "1 month" };
    return { target: streak + 10, message: `${streak + 10} days` };
  };

  const nextMilestone = getNextMilestone(streak);
  const streakColors = getStreakColor(streak);
  const streakMessage = getStreakMessage(streak);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      fullWidth && styles.containerFull,
      pressed && styles.containerPressed
    ]}>
      <LinearGradient
        colors={streakColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      
      {/* Glow effect */}
      <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
        <LinearGradient
          colors={['rgba(249,115,22,0.3)', 'rgba(249,115,22,0)']}
          style={styles.glow}
        />
      </Animated.View>

      <View style={styles.content}>
        {/* Animated Flame */}
        <Animated.View style={[styles.fireContainer, animatedFlameStyle]}>
          <View style={styles.fireIcon}>
            <Ionicons name="flame" size={44} color="#ffffff" />
          </View>
          <View style={styles.fireSparkles}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.sparkle, { 
                top: -5 + i * 5,
                right: -10 + i * 8,
                opacity: 0.6 - i * 0.2
              }]} />
            ))}
          </View>
        </Animated.View>

        {/* Streak Info */}
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>
            {streak}
            <Text style={styles.streakUnit}> days</Text>
          </Text>
          <Text style={styles.streakLabel}>
            {streak === 1 ? 'Day Streak' : 'Day Streak'}
          </Text>
          <View style={styles.messageContainer}>
            <Text style={styles.streakMessage}>{streakMessage}</Text>
          </View>
        </View>

        {/* Achievement Badge */}
        {streak >= 7 && (
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={14} color="#fbbf24" />
            <Text style={styles.achievementText}>
              {streak >= 30 ? 'Legend' : streak >= 14 ? 'On Fire!' : 'On a Roll!'}
            </Text>
          </View>
        )}
      </View>

      {/* Progress to next milestone */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabel}>
          <Text style={styles.progressText}>
            Next milestone: {nextMilestone.message}
          </Text>
          <Text style={styles.progressPercent}>
            {Math.min(100, Math.round((streak / nextMilestone.target) * 100))}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(100, (streak / nextMilestone.target) * 100)}%` }
            ]} 
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  containerFull: {
    marginHorizontal: 0,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowContainer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    position: 'relative',
    zIndex: 2,
  },
  fireContainer: {
    marginRight: 16,
    position: 'relative',
  },
  fireIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fireSparkles: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fbbf24',
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  streakUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  streakMessage: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  achievementBadge: {
    position: 'absolute',
    top: 12,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  achievementText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
  },
  progressSection: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    position: 'relative',
    zIndex: 2,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fbbf24',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
});