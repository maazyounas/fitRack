import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '@/types/exercise';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useAuthStore } from '@/store/authStore';
import { setExerciseFavorite, rateExercise } from '@/services/api/exercise';
import { RatingComponent } from './RatingComponent';

interface ExerciseDetailProps {
  exercise: Exercise;
  onClose: () => void;
  onFavoriteChange?: (isFavorite: boolean) => void;
  onAddToWorkout?: () => void;
}

export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({
  exercise,
  onClose,
  onFavoriteChange,
  onAddToWorkout,
}) => {
  const palette = useAppPalette();
  const { tokens } = useAuthStore();
  const accessToken = tokens?.accessToken;
  const [isFavorite, setIsFavorite] = useState(exercise.isFavorite);
  const [currentRating, setCurrentRating] = useState(exercise.currentUserRating);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoritePress = async () => {
    if (!accessToken || isLoading) return;

    setIsLoading(true);
    try {
      const newFavorite = !isFavorite;
      await setExerciseFavorite(accessToken, exercise.id, newFavorite);
      setIsFavorite(newFavorite);
      onFavoriteChange?.(newFavorite);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRating = async (score: number) => {
    if (!accessToken || isLoading) return;

    setIsLoading(true);
    try {
      await rateExercise(accessToken, exercise.id, score);
      setCurrentRating(score);
    } catch (error) {
      Alert.alert('Error', 'Failed to save rating');
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    // Extract video ID from YouTube URL
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([^&\n?#]+)/);
    const videoId = videoIdMatch?.[1];
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const difficultyColor = {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336',
  }[exercise.difficulty];

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.card }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: palette.text }]}>{exercise.name}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: difficultyColor }]}>
              <Text style={styles.badgeText}>{exercise.difficulty}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: palette.tint }]}>
              <Text style={[styles.badgeText, { color: palette.background }]}>
                {exercise.muscleGroup}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={handleFavoritePress} disabled={isLoading}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? '#FF1744' : palette.mutedText}
          />
        </Pressable>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Overview</Text>
        <Text style={[styles.description, { color: palette.mutedText }]}>
          {exercise.description}
        </Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="settings" size={20} color={palette.tint} />
            <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Equipment</Text>
            <Text style={[styles.infoValue, { color: palette.text }]}>{exercise.equipment}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flame" size={20} color={palette.tint} />
            <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Target</Text>
            <Text style={[styles.infoValue, { color: palette.text }]}>
              {exercise.targetMuscles.join(', ') || 'Multiple'}
            </Text>
          </View>
        </View>
      </View>

      {/* Video Demo */}
      {exercise.demoVideos.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Demo Video</Text>
          {exercise.demoVideos.map((video, index) => {
            const videoIdMatch = video.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([^&\n?#]+)/);
            const videoId = videoIdMatch?.[1];
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

            return (
              <Pressable
                key={index}
                onPress={() => Linking.openURL(video.url)}
                style={[styles.videoContainer, { backgroundColor: palette.card }]}>
                {thumbnailUrl && (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.videoThumbnail}
                  />
                )}
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={48} color={palette.tint} />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={[styles.videoTitle, { color: palette.text }]} numberOfLines={1}>
                    {video.title}
                  </Text>
                  <Text style={[styles.videoUrl, { color: palette.mutedText }]}>
                    Tap to watch on YouTube
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Instructions</Text>
        {exercise.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={[styles.stepNumber, { backgroundColor: palette.tint }]}>
              <Text style={[styles.stepText, { color: palette.background }]}>{index + 1}</Text>
            </View>
            <Text style={[styles.instructionText, { color: palette.text }]}>{instruction}</Text>
          </View>
        ))}
      </View>

      {/* Rating */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Your Rating</Text>
        <RatingComponent
          currentRating={currentRating}
          onRatePress={handleRating}
          disabled={isLoading}
        />
        {exercise.ratingCount > 0 && (
          <Text style={[styles.ratingStats, { color: palette.mutedText }]}>
            Average: {exercise.ratingAverage.toFixed(1)} ⭐ ({exercise.ratingCount} ratings)
          </Text>
        )}
      </View>

      {/* Comments */}
      {exercise.comments.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Community Comments ({exercise.comments.length})
          </Text>
          <FlatList
            data={exercise.comments.slice(0, 3)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.comment, { backgroundColor: palette.card }]}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentUser, { color: palette.text }]}>{item.userName}</Text>
                  <Text style={[styles.commentDate, { color: palette.mutedText }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.commentContent, { color: palette.text }]}>{item.content}</Text>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.button, { backgroundColor: palette.tint }]}
          onPress={onAddToWorkout}>
          <Ionicons name="add-circle" size={20} color={palette.background} />
          <Text style={[styles.buttonText, { color: palette.background }]}>Add to Workout</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: palette.card }]}
          onPress={onClose}>
          <Text style={[styles.buttonText, { color: palette.text }]}>Close</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  videoContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 240,
    position: 'relative',
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
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  videoUrl: {
    fontSize: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 4,
  },
  ratingStats: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  comment: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    fontSize: 13,
  },
  commentDate: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
