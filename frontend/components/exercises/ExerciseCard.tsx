import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '@/types/exercise';
import { useAppPalette } from '@/hooks/useAppPalette';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: () => void;
  showFavoriteButton?: boolean;
  onFavoritePress?: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  showFavoriteButton = false,
  onFavoritePress,
}) => {
  const palette = useAppPalette();

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { color: '#10b981', label: 'Beginner' };
      case 'intermediate':
        return { color: '#d1ae67', label: 'Intermediate' };
      case 'advanced':
        return { color: '#d9a8a8', label: 'Advanced' };
      default:
        return { color: '#64748b', label: difficulty };
    }
  };
  const difficultyConfig = getDifficultyConfig(exercise.difficulty);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      { backgroundColor: palette.card },
      pressed && styles.containerPressed,
    ]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.exerciseName, { color: palette.text }]} numberOfLines={1}>
            {exercise.name}
          </Text>
          <View style={styles.meta}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.color }]}>
              <Text style={styles.difficultyText}>{difficultyConfig.label}</Text>
            </View>
            <Text style={[styles.muscleGroup, { color: palette.mutedText }]}>
              {exercise.muscleGroup}
            </Text>
          </View>
        </View>
        {showFavoriteButton && (
          <Pressable
            onPress={(e) => {
              e.preventDefault();
              onFavoritePress?.();
            }}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={exercise.isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={exercise.isFavorite ? '#ef4444' : palette.mutedText}
            />
          </Pressable>
        )}
      </View>

      <Text style={[styles.description, { color: palette.mutedText }]} numberOfLines={2}>
        {exercise.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stats}>
          {exercise.ratingCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={[styles.statText, { color: palette.text }]}>
                {exercise.ratingAverage.toFixed(1)}
              </Text>
            </View>
          )}
          {exercise.favoriteCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="heart" size={14} color="#ef4444" />
              <Text style={[styles.statText, { color: palette.text }]}>
                {exercise.favoriteCount}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.equipmentBadge}>
          <Ionicons name="fitness-outline" size={12} color={palette.mutedText} />
          <Text style={[styles.equipment, { color: palette.mutedText }]} numberOfLines={1}>
            {exercise.equipment}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  containerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  muscleGroup: {
    fontSize: 12,
    fontWeight: '400',
  },
  favoriteButton: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  equipmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equipment: {
    fontSize: 11,
    fontWeight: '400',
  },
});