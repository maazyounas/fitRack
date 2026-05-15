import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppPalette } from '@/hooks/useAppPalette';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CompletionModalProps {
  visible: boolean;
  workoutName: string;
  duration: number;
  exercisesCount: number;
  streak: number;
  onClose: () => void;
  onViewHistory?: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  workoutName,
  duration,
  exercisesCount,
  streak,
  onClose,
  onViewHistory,
}) => {
  const palette = useAppPalette();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const getMotivationalMessage = () => {
    if (streak === 1) return "First workout done! Let's build that momentum 🔥";
    if (streak >= 30) return `Legendary! ${streak} day streak! You're unstoppable! 👑`;
    if (streak >= 14) return `Incredible dedication! ${streak} day streak! 🔥🔥`;
    if (streak >= 7) return `One full week! Amazing consistency! 🌟`;
    if (streak >= 3) return `Keep this energy going! ${streak} days strong! 💪`;
    return "Another workout crushed! You're getting stronger every day ✨";
  };

  const getCelebrationColor = () => {
    if (streak >= 30) return ['#fbbf24', '#d97706'];
    if (streak >= 14) return ['#f97316', '#ea580c'];
    if (streak >= 7) return ['#10b981', '#059669'];
    return ['#0d9488', '#0f766e'];
  };

  const celebrationColors = getCelebrationColor();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: palette.background,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}>
          {/* Success Animation */}
          <View style={styles.celebrationContainer}>
            <LinearGradient
              colors={celebrationColors}
              style={styles.circleGradient}>
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark" size={56} color="#ffffff" />
              </View>
            </LinearGradient>
            <Text style={[styles.congratsText, { color: palette.text }]}>
              Workout Complete!
            </Text>
            <Text style={[styles.subText, { color: palette.mutedText }]}>
              You're making incredible progress
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: palette.card }]}>
              <View style={styles.statIcon}>
                <Ionicons name="time-outline" size={24} color="#0d9488" />
              </View>
              <Text style={[styles.statValue, { color: palette.text }]}>{duration}</Text>
              <Text style={[styles.statLabel, { color: palette.mutedText }]}>minutes</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: palette.card }]}>
              <View style={styles.statIcon}>
                <Ionicons name="barbell-outline" size={24} color="#0d9488" />
              </View>
              <Text style={[styles.statValue, { color: palette.text }]}>{exercisesCount}</Text>
              <Text style={[styles.statLabel, { color: palette.mutedText }]}>exercises</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: palette.card }]}>
              <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="flame" size={24} color="#f97316" />
              </View>
              <Text style={[styles.statValue, { color: palette.text }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: palette.mutedText }]}>day streak</Text>
            </View>
          </View>

          {/* Workout Info */}
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: palette.text }]} numberOfLines={1}>
              {workoutName}
            </Text>
            <View style={styles.motivationContainer}>
              <Text style={[styles.motivationalText, { color: palette.mutedText }]}>
                {getMotivationalMessage()}
              </Text>
            </View>
          </View>

          {/* Streak Bonus */}
          {streak >= 7 && (
            <View style={styles.streakBonus}>
              <LinearGradient
                colors={['#fef3c7', '#fde68a']}
                style={styles.streakBonusGradient}>
                <Ionicons name="gift" size={16} color="#d97706" />
                <Text style={styles.streakBonusText}>
                  {streak >= 30 ? 'Legendary bonus earned!' : 'Streak bonus unlocked!'}
                </Text>
              </LinearGradient>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={onClose}>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </Pressable>

            {onViewHistory && (
              <Pressable
                style={[styles.button, styles.secondaryButton, { backgroundColor: palette.card }]}
                onPress={onViewHistory}>
                <Ionicons name="calendar-outline" size={18} color={palette.text} />
                <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
                  View History
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 28,
    padding: 24,
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circleGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congratsText: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'lowercase',
  },
  workoutInfo: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  motivationalText: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
  },
  streakBonus: {
    marginBottom: 20,
    width: '100%',
  },
  streakBonusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  streakBonusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  actions: {
    gap: 10,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryButton: {
    backgroundColor: '#0d9488',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
});