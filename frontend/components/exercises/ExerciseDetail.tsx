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
import { LinearGradient } from 'expo-linear-gradient';
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

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { color: '#10b981', label: 'Beginner' };
      case 'intermediate':
        return { color: '#f59e0b', label: 'Intermediate' };
      case 'advanced':
        return { color: '#ef4444', label: 'Advanced' };
      default:
        return { color: '#64748b', label: difficulty };
    }
  };

  const difficultyConfig = getDifficultyConfig(exercise.difficulty);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: palette.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.heroSection}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Pressable onPress={handleFavoritePress} disabled={isLoading} style={styles.heroFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#ef4444' : '#ffffff'}
          />
        </Pressable>
        <Text style={styles.heroTitle}>{exercise.name}</Text>
        <View style={styles.heroBadges}>
          <View style={[styles.heroBadge, { backgroundColor: difficultyConfig.color }]}>
            <Text style={styles.heroBadgeText}>{difficultyConfig.label}</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.heroBadgeText}>{exercise.muscleGroup}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Overview Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle-outline" size={20} color="#0d9488" />
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Overview</Text>
        </View>
        <Text style={[styles.description, { color: palette.mutedText }]}>
          {exercise.description}
        </Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Ionicons name="fitness-outline" size={22} color="#0d9488" />
            <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Equipment</Text>
            <Text style={[styles.infoValue, { color: palette.text }]}>{exercise.equipment}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="body-outline" size={22} color="#0d9488" />
            <Text style={[styles.infoLabel, { color: palette.mutedText }]}>Target Muscles</Text>
            <Text style={[styles.infoValue, { color: palette.text }]} numberOfLines={2}>
              {exercise.targetMuscles.join(', ') || 'Multiple'}
            </Text>
          </View>
        </View>
      </View>

      {/* Video Demo Section */}
      {exercise.demoVideos.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle-outline" size={20} color="#0d9488" />
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Demo Video</Text>
          </View>
          {exercise.demoVideos.map((video, index) => {
            const videoIdMatch = video.url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=))([^&\n?#]+)/);
            const videoId = videoIdMatch?.[1];
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

            return (
              <Pressable
                key={index}
                onPress={() => Linking.openURL(video.url)}
                style={styles.videoCard}
              >
                {thumbnailUrl && (
                  <Image source={{ uri: thumbnailUrl }} style={styles.videoThumbnail} />
                )}
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.7)']} 
                  style={styles.videoOverlay}
                />
                <View style={styles.videoPlayIcon}>
                  <Ionicons name="play-circle" size={48} color="#ffffff" />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={1}>
                    {video.title}
                  </Text>
                  <Text style={styles.videoSubtitle}>Tap to watch on YouTube</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Instructions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color="#0d9488" />
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Instructions</Text>
        </View>
        {exercise.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={[styles.instructionText, { color: palette.text }]}>
              {instruction}
            </Text>
          </View>
        ))}
      </View>

      {/* Rating Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="star-outline" size={20} color="#0d9488" />
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Rate this exercise</Text>
        </View>
        <RatingComponent
          currentRating={currentRating}
          onRatePress={handleRating}
          disabled={isLoading}
        />
        {exercise.ratingCount > 0 && (
          <Text style={[styles.ratingStats, { color: palette.mutedText }]}>
            ⭐ {exercise.ratingAverage.toFixed(1)} average ({exercise.ratingCount} ratings)
          </Text>
        )}
      </View>

      {/* Comments Section */}
      {exercise.comments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles-outline" size={20} color="#0d9488" />
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Community feedback ({exercise.comments.length})
            </Text>
          </View>
          {exercise.comments.slice(0, 3).map((comment) => (
            <View key={comment.id} style={[styles.commentCard, { backgroundColor: palette.card }]}>
              <View style={styles.commentHeader}>
                <Text style={[styles.commentUser, { color: palette.text }]}>{comment.userName}</Text>
                <Text style={[styles.commentDate, { color: palette.mutedText }]}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.commentContent, { color: palette.mutedText }]}>
                {comment.content}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={styles.primaryButton} onPress={onAddToWorkout}>
          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.primaryButtonText}>Add to Workout</Text>
        </Pressable>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  heroFavorite: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  heroBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  heroBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  videoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 220,
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
  },
  videoPlayIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  videoSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  ratingStats: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  commentCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 11,
    fontWeight: '400',
  },
  commentContent: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0d9488',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});