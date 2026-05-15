import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutExercise, WorkoutPlan } from '@/types/workout';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useAuthStore } from '@/store/authStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { ExerciseTimer } from './ExerciseTimer';
import { CompletionModal } from './CompletionModal';
import { fetchExercises } from '@/services/api/exercise';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WorkoutExecutionScreenProps {
  workoutId: string;
}

export const WorkoutExecutionScreen: React.FC<WorkoutExecutionScreenProps> = ({ workoutId }) => {
  const palette = useAppPalette();
  const router = useRouter();
  const { tokens } = useAuthStore();
  const accessToken = tokens?.accessToken;
  const { plans, markCompleted, workoutStreak } = useWorkoutStore();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [showCompletion, setShowCompletion] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [exerciseVideos, setExerciseVideos] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  const workout = plans.find((p) => p.id === workoutId);
  const currentExercise = workout?.exercises[currentExerciseIndex];

  useEffect(() => {
    const loadExerciseVideos = async () => {
      if (!accessToken || !workout?.exercises.length) return;

      try {
        const exerciseNames = [...new Set(workout.exercises.map((ex) => ex.name))];
        const data = await fetchExercises(accessToken, {
          search: exerciseNames[0],
        });

        const videos: Record<string, string> = {};
        data.exercises.forEach((ex) => {
          if (ex.demoVideos.length > 0) {
            const videoIdMatch = ex.demoVideos[0].url.match(
              /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([^&\n?#]+)/
            );
            if (videoIdMatch) {
              videos[ex.name] = `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
            }
          }
        });
        setExerciseVideos(videos);
      } catch (error) {
        console.error('Failed to load exercise videos:', error);
      }
    };

    void loadExerciseVideos();
  }, [workout?.exercises, accessToken]);

  const duration = Math.round((Date.now() - startTime) / 60000);
  const progress = completedExercises.length / (workout?.exercises.length || 1);

  const handleExerciseComplete = () => {
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      setCompletedExercises([...completedExercises, currentExerciseIndex]);
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setShowTimer(false);
    } else {
      handleWorkoutComplete();
    }
  };

  const handleWorkoutComplete = async () => {
    if (!workout) return;

    setIsLoading(true);
    try {
      const scheduleEntry = workout.schedule.find((entry) => {
        const entryDate = new Date(entry.scheduledDate);
        const today = new Date();
        return (
          entryDate.toDateString() === today.toDateString() && !entry.completed
        );
      });

      if (scheduleEntry?.['_id']) {
        await markCompleted(workout.id, scheduleEntry['_id']);
      }

      setShowCompletion(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete workout');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipExercise = () => {
    Alert.alert('Skip Exercise?', 'Are you sure you want to skip this exercise?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
          } else {
            handleWorkoutComplete();
          }
        },
      },
    ]);
  };

  const handleAbort = () => {
    Alert.alert('End Workout?', 'Are you sure you want to stop this workout?', [
      { text: 'Continue', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  if (!workout || !currentExercise) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  const thumbnailUrl = exerciseVideos[currentExercise.name];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.header}>
        <Pressable onPress={handleAbort} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {workout.name}
          </Text>
          <View style={styles.headerMeta}>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={12} color="#5eead4" />
              <Text style={styles.headerMetaText}>{duration} min</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="repeat-outline" size={12} color="#5eead4" />
              <Text style={styles.headerMetaText}>
                {currentExerciseIndex + 1} / {workout.exercises.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#f97316" />
          <Text style={styles.streakText}>{workoutStreak}</Text>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress * 100)}% complete</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Card */}
        <View style={[styles.exerciseCard, { backgroundColor: palette.card }]}>
          {/* Video Thumbnail */}
          {thumbnailUrl && (
            <View style={styles.videoContainer}>
              <Image source={{ uri: thumbnailUrl }} style={styles.videoThumbnail} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.videoOverlay}
              />
              <View style={styles.videoPlayIcon}>
                <Ionicons name="play-circle" size={56} color="#ffffff" />
              </View>
            </View>
          )}

          {/* Exercise Title */}
          <Text style={[styles.exerciseName, { color: palette.text }]}>
            {currentExercise.name}
          </Text>

          {/* Exercise Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.detailIcon}>
                <Ionicons name="repeat" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.detailValue}>{currentExercise.sets}</Text>
              <Text style={styles.detailLabel}>Sets</Text>
            </View>

            <View style={styles.detailCard}>
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.detailIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.detailValue}>{currentExercise.reps}</Text>
              <Text style={styles.detailLabel}>Reps</Text>
            </View>

            <View style={styles.detailCard}>
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.detailIcon}>
                <Ionicons name="timer" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.detailValue}>{currentExercise.restSeconds}s</Text>
              <Text style={styles.detailLabel}>Rest</Text>
            </View>

            <View style={styles.detailCard}>
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.detailIcon}>
                <Ionicons name="flash" size={20} color="#ffffff" />
              </LinearGradient>
              <Text style={styles.detailValue}>{currentExercise.intensity}</Text>
              <Text style={styles.detailLabel}>Intensity</Text>
            </View>
          </View>

          {/* Notes */}
          {currentExercise.notes && (
            <View style={styles.notesSection}>
              <Ionicons name="chatbubble-outline" size={14} color="#0d9488" />
              <Text style={[styles.notesText, { color: palette.mutedText }]}>
                {currentExercise.notes}
              </Text>
            </View>
          )}

          {/* Muscle Group & Equipment */}
          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Ionicons name="body-outline" size={12} color="#0d9488" />
              <Text style={styles.infoText}>{currentExercise.muscleGroup}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="fitness-outline" size={12} color="#0d9488" />
              <Text style={styles.infoText}>{currentExercise.equipment}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Timer Modal */}
      <Modal visible={showTimer} transparent animationType="fade">
        <View style={styles.timerModalOverlay}>
          <View style={[styles.timerModalContent, { backgroundColor: palette.background }]}>
            <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.timerHeader}>
              <Ionicons name="timer-outline" size={24} color="#ffffff" />
              <Text style={styles.timerTitle}>Rest Time</Text>
            </LinearGradient>
            <ExerciseTimer
              initialSeconds={currentExercise.restSeconds}
              onComplete={() => setShowTimer(false)}
              autoStart
            />
            <Pressable
              style={styles.timerSkipButton}
              onPress={() => setShowTimer(false)}>
              <Text style={styles.timerSkipText}>Skip rest →</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletion}
        workoutName={workout.name}
        duration={duration}
        exercisesCount={workout.exercises.length}
        streak={workoutStreak}
        onClose={() => {
          setShowCompletion(false);
          router.back();
        }}
      />

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Pressable style={styles.footerButtonSecondary} onPress={handleSkipExercise}>
          <Ionicons name="play-skip-forward" size={20} color="#64748b" />
          <Text style={styles.footerButtonSecondaryText}>Skip</Text>
        </Pressable>

        <Pressable style={styles.footerButtonPrimary} onPress={() => setShowTimer(true)}>
          <Ionicons name="timer-outline" size={20} color="#ffffff" />
          <Text style={styles.footerButtonPrimaryText}>Rest</Text>
        </Pressable>

        <Pressable style={styles.footerButtonSuccess} onPress={handleExerciseComplete}>
          <Ionicons name="checkmark" size={20} color="#ffffff" />
          <Text style={styles.footerButtonPrimaryText}>Complete</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerMetaText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#5eead4',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249,115,22,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f97316',
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0d9488',
    marginTop: 6,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exerciseCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoPlayIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailCard: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 6,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748b',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#475569',
  },
  timerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModalContent: {
    borderRadius: 28,
    overflow: 'hidden',
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  timerSkipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timerSkipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d9488',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  footerButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  footerButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#0d9488',
  },
  footerButtonSuccess: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#10b981',
  },
  footerButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});