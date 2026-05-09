import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const difficultyColor = {
    beginner: '#4CAF50',
    intermediate: '#FF9800',
    advanced: '#F44336',
  }[exercise.difficulty];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor: palette.card }]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.exerciseName, { color: palette.text }]} numberOfLines={1}>
            {exercise.name}
          </Text>
          <View style={styles.meta}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
              <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
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
            style={styles.favoriteButton}>
            <Ionicons
              name={exercise.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={exercise.isFavorite ? '#FF1744' : palette.mutedText}
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
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={[styles.statText, { color: palette.text }]}>
                {exercise.ratingAverage.toFixed(1)}
              </Text>
            </View>
          )}
          {exercise.favoriteCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="heart" size={16} color="#FF1744" />
              <Text style={[styles.statText, { color: palette.text }]}>
                {exercise.favoriteCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.equipment, { color: palette.mutedText }]}>
          {exercise.equipment}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  muscleGroup: {
    fontSize: 12,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 8,
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
  equipment: {
    fontSize: 12,
  },
});
