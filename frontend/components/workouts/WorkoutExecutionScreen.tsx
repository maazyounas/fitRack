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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { WorkoutExercise, WorkoutPlan } from '@/types/workout';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useAuthStore } from '@/store/authStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { ExerciseTimer } from './ExerciseTimer';
import { CompletionModal } from './CompletionModal';
import { fetchExercises } from '@/services/api/exercise';

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

  const workout = plans.find((p) => p.id === workoutId);
  const currentExercise = workout?.exercises[currentExerciseIndex];

  // Fetch exercise video thumbnails
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
        <ActivityIndicator size="large" color={palette.tint} />
      </View>
    );
  }

  const thumbnailUrl = exerciseVideos[currentExercise.name];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header with Progress */}
      <View style={[styles.header, { backgroundColor: palette.card }]}>
        <Pressable onPress={handleAbort} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={palette.text} />
        </Pressable>

        <View style={styles.headerContent}>
          <Text style={[styles.workoutTitle, { color: palette.text }]} numberOfLines={1}>
            {workout.name}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={[styles.headerMetaText, { color: palette.mutedText }]}>
              {duration} min
            </Text>
            <Text style={[styles.headerMetaText, { color: palette.mutedText }]}>
              • {currentExerciseIndex + 1} / {workout.exercises.length}
            </Text>
          </View>
        </View>

        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color="#FF6B6B" />
          <Text style={styles.streakText}>{workoutStreak}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: palette.card }]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: palette.tint,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Exercise Card */}
        <View style={[styles.exerciseCard, { backgroundColor: palette.card }]}>
          {/* Video Thumbnail */}
          {thumbnailUrl && (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={48} color={palette.tint} />
              </View>
              <Text style={[styles.videoHint, { color: palette.mutedText }]}>
                Demo video available
              </Text>
            </View>
          )}

          {/* Exercise Title */}
          <Text style={[styles.exerciseName, { color: palette.text }]}>
            {currentExercise.name}
          </Text>

          {/* Exercise Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="repeat" size={24} color={palette.tint} />
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {currentExercise.sets}
              </Text>
              <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                Sets
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle" size={24} color={palette.tint} />
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {currentExercise.reps}
              </Text>
              <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                Reps
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="timer" size={24} color={palette.tint} />
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {currentExercise.restSeconds}s
              </Text>
              <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                Rest
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="barbell" size={24} color={palette.tint} />
              <Text style={[styles.detailValue, { color: palette.text }]}>
                {currentExercise.intensity}
              </Text>
              <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
                Intensity
              </Text>
            </View>
          </View>

          {/* Instructions */}
          {currentExercise.notes && (
            <View style={styles.notesSection}>
              <Text style={[styles.notesTitle, { color: palette.text }]}>Notes</Text>
              <Text style={[styles.notesText, { color: palette.mutedText }]}>
                {currentExercise.notes}
              </Text>
            </View>
          )}

          {/* Muscle Groups */}
          <View style={styles.muscleGroupContainer}>
            <Text style={[styles.muscleGroupLabel, { color: palette.mutedText }]}>
              Target: {currentExercise.muscleGroup} • Equipment: {currentExercise.equipment}
            </Text>
          </View>
        </View>

        {/* Timer Modal */}
        <Modal visible={showTimer} transparent animationType="fade">
          <View style={styles.timerModalOverlay}>
            <View style={[styles.timerModalContent, { backgroundColor: palette.background }]}>
              <Text style={[styles.timerModalTitle, { color: palette.text }]}>
                Rest between sets
              </Text>
              <ExerciseTimer
                initialSeconds={currentExercise.restSeconds}
                onComplete={() => setShowTimer(false)}
                autoStart
              />
              <Pressable
                style={[styles.timerSkipButton, { backgroundColor: palette.card }]}
                onPress={() => setShowTimer(false)}>
                <Text style={[styles.timerSkipText, { color: palette.text }]}>Skip rest</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Exercise Completed Modal */}
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
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: palette.card }]}>
        <Pressable
          style={[styles.footerButton, { backgroundColor: palette.card }]}
          onPress={handleSkipExercise}>
          <Ionicons name="play-skip-forward" size={20} color={palette.text} />
          <Text style={[styles.footerButtonText, { color: palette.text }]}>Skip</Text>
        </Pressable>

        <Pressable
          style={[styles.footerButton, { backgroundColor: palette.tint }]}
          disabled={isLoading}
          onPress={() => setShowTimer(true)}>
          {isLoading ? (
            <ActivityIndicator color={palette.background} />
          ) : (
            <>
              <Ionicons name="timer" size={20} color={palette.background} />
              <Text style={[styles.footerButtonText, { color: palette.background }]}>
                Rest Timer
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.footerButton, { backgroundColor: '#4CAF50' }]}
          onPress={handleExerciseComplete}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={[styles.footerButtonText, { color: '#fff' }]}>Done</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  headerMetaText: {
    fontSize: 12,
    marginRight: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    gap: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  progressBarContainer: {
    height: 4,
  },
  progressBar: {
    height: '100%',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 120,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#fff',
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  muscleGroupContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  muscleGroupLabel: {
    fontSize: 13,
  },
  timerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModalContent: {
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  timerModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  timerSkipButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  timerSkipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
