import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { WorkoutExercise } from '@/types/workout';
import { useAppPalette } from '@/hooks/useAppPalette';

interface DraggableExerciseListProps {
  exercises: WorkoutExercise[];
  onReorder: (reorderedExercises: WorkoutExercise[]) => void;
  editable?: boolean;
}

export const DraggableExerciseList: React.FC<DraggableExerciseListProps> = ({
  exercises,
  onReorder,
  editable = true,
}) => {
  const palette = useAppPalette();
  const [currentExercises, setCurrentExercises] = useState(exercises);

  useEffect(() => {
    setCurrentExercises(exercises);
  }, [exercises]);

  const handleDragEnd = ({ data }: { data: WorkoutExercise[] }) => {
    const reorderedWithOrder = data.map((ex, idx) => ({
      ...ex,
      order: idx + 1,
    }));
    setCurrentExercises(reorderedWithOrder);
    onReorder(reorderedWithOrder);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<WorkoutExercise>) => {
    const index = getIndex();
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={editable ? drag : undefined}
          disabled={isActive}
          style={[
            styles.exerciseItem,
            {
              backgroundColor: palette.card,
              borderLeftColor: palette.tint,
              elevation: isActive ? 5 : 0,
              shadowColor: '#000',
              shadowOpacity: isActive ? 0.2 : 0,
              shadowRadius: isActive ? 5 : 0,
              shadowOffset: { width: 0, height: isActive ? 2 : 0 },
              transform: [{ scale: isActive ? 1.02 : 1 }],
            },
          ]}>
          {/* Order Indicator */}
          <View
            style={[
              styles.orderBadge,
              {
                backgroundColor: palette.tint,
              },
            ]}>
            <Text style={[styles.orderText, { color: palette.background }]}>
              {item.order}
            </Text>
          </View>

          {/* Exercise Info */}
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, { color: palette.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.exerciseMeta}>
              <Text style={[styles.metaText, { color: palette.mutedText }]}>
                {item.sets}×{item.reps}
              </Text>
              <Text style={[styles.metaText, { color: palette.mutedText }]}>
                • {item.muscleGroup}
              </Text>
              {item.restSeconds > 0 && (
                <Text style={[styles.metaText, { color: palette.mutedText }]}>
                  • Rest {item.restSeconds}s
                </Text>
              )}
            </View>
          </View>

          {/* Drag Controls */}
          {editable && (
            <View style={styles.controls}>
              <Pressable
                onPressIn={drag}
                style={styles.controlButton}>
                <Ionicons
                  name="menu"
                  size={24}
                  color={palette.mutedText}
                />
              </Pressable>
            </View>
          )}
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={currentExercises}
        onDragEnd={handleDragEnd}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  orderBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    marginRight: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    padding: 8,
  },
});
