import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppPalette } from '@/hooks/useAppPalette';

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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.container, { backgroundColor: palette.background }]}>
          {/* Celebration Animation */}
          <View style={styles.celebrationContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={[styles.congratsText, { color: palette.text }]}>Workout Complete!</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: palette.card }]}>
              <Ionicons name="time" size={32} color={palette.tint} />
              <Text style={[styles.statValue, { color: palette.text }]}>{duration}</Text>
              <Text style={[styles.statLabel, { color: palette.mutedText }]}>Minutes</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: palette.card }]}>
              <Ionicons name="barbell" size={32} color={palette.tint} />
              <Text style={[styles.statValue, { color: palette.text }]}>{exercisesCount}</Text>
              <Text style={[styles.statLabel, { color: palette.mutedText }]}>Exercises</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: palette.card }]}>
              <Ionicons name="flame" size={32} color="#FF6B6B" />
              <Text style={[styles.statValue, { color: palette.text }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: palette.mutedText }]}>Day Streak</Text>
            </View>
          </View>

          {/* Workout Name */}
          <View style={styles.workoutInfo}>
            <Text style={[styles.workoutName, { color: palette.text }]}>{workoutName}</Text>
            <Text style={[styles.motivationalText, { color: palette.mutedText }]}>
              {streak === 1
                ? '🔥 Keep it up! Build that momentum.'
                : streak > 7
                  ? `🌟 Amazing! ${streak} day streak!`
                  : streak > 3
                    ? '💪 Great consistency!'
                    : '✨ Great work!'}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, { backgroundColor: palette.tint }]}
              onPress={onClose}>
              <Text style={[styles.buttonText, { color: palette.background }]}>Done</Text>
            </Pressable>

            {onViewHistory && (
              <Pressable
                style={[styles.button, { backgroundColor: palette.card }]}
                onPress={onViewHistory}>
                <Text style={[styles.buttonText, { color: palette.text }]}>View History</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    borderRadius: 24,
    padding: 24,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
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
    paddingVertical: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  workoutInfo: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
