import React, { useState, useEffect } from 'react';
import { deleteExercise } from '@/services/api/exercise';

import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { WorkoutExercise } from '@/types/workout';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useAuthStore } from '@/store/authStore';

interface DraggableExerciseListProps {
  exercises: WorkoutExercise[];
  onReorder: (reorderedExercises: WorkoutExercise[]) => void;
  editable?: boolean;
  onDelete?: (exerciseId: string) => void;
  onEdit?: (exercise: WorkoutExercise) => void;
}

export const DraggableExerciseList: React.FC<DraggableExerciseListProps> = ({
  exercises,
  onReorder,
  editable = true,
  onDelete,
  onEdit,
}) => {
  const { tokens } = useAuthStore();
  const accessToken = tokens?.accessToken;
  const palette = useAppPalette();
  const [currentExercises, setCurrentExercises] = useState(exercises);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleDelete = async (exerciseId: string) => {
    Alert.alert('Delete Exercise', 'Are you sure you want to delete this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (accessToken) {
              await deleteExercise(accessToken, exerciseId);
            }
          } catch (e) {
            console.error('Failed to delete exercise:', e);
          }
          const updated = currentExercises.filter(ex => ex._id !== exerciseId);
          setCurrentExercises(updated);
          onDelete?.(exerciseId);
        },
      },
    ]);
  };

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
    setDraggingIndex(null);
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: Record<string, string> = {
      chest: '#ef4444',
      back: '#3b82f6',
      legs: '#10b981',
      shoulders: '#f59e0b',
      arms: '#8b5cf6',
      core: '#06b6d4',
    };
    return colors[muscleGroup.toLowerCase()] || '#64748b';
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<WorkoutExercise>) => {
    const index = getIndex();
    const muscleColor = getMuscleGroupColor(item.muscleGroup);
    
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={editable ? drag : undefined}
          disabled={isActive}
          style={[
            styles.exerciseItem,
            {
              backgroundColor: palette.card,
              borderLeftColor: muscleColor,
              shadowOpacity: isActive ? 0.15 : 0,
              shadowRadius: isActive ? 12 : 0,
              transform: [{ scale: isActive ? 1.02 : 1 }],
            },
          ]}>
          {/* Drag Handle */}
          {editable && (
            <Pressable onPressIn={drag} style={styles.dragHandle}>
              <Ionicons name="menu" size={20} color="#94a3b8" />
            </Pressable>
          )}

          {/* Order Number */}
          <View style={[styles.orderBadge, { backgroundColor: `${muscleColor}15` }]}>
            <Text style={[styles.orderText, { color: muscleColor }]}>{item.order}</Text>
          </View>

          {/* Exercise Info */}
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, { color: palette.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.exerciseMeta}>
              <View style={styles.metaPill}>
                <Ionicons name="repeat-outline" size={10} color="#64748b" />
                <Text style={styles.metaText}>
                  {item.sets} × {item.reps}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="body-outline" size={10} color="#64748b" />
                <Text style={styles.metaText}>{item.muscleGroup}</Text>
              </View>
              {item.restSeconds > 0 && (
                <View style={styles.metaPill}>
                  <Ionicons name="timer-outline" size={10} color="#64748b" />
                  <Text style={styles.metaText}>{item.restSeconds}s rest</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {onEdit && (
              <Pressable
                onPress={() => onEdit(item)}
                style={styles.actionButton}>
                <Ionicons name="create-outline" size={18} color="#0d9488" />
              </Pressable>
            )}
            {onDelete && (
                <Pressable
                  onPress={() => {
                if (item._id) {
                  handleDelete(item._id);
                }
              }}
                  style={styles.actionButton}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            )}
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  };

  if (currentExercises.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.emptyContent}>
          <Ionicons name="barbell-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No exercises yet</Text>
          <Text style={styles.emptyText}>Add exercises to build your workout</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercises</Text>
        <Text style={styles.headerCount}>{currentExercises.length} items</Text>
      </View>
      
      <DraggableFlatList
        data={currentExercises}
        onDragEnd={handleDragEnd}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onDragBegin={({ index }) => setDraggingIndex(index)}
        activationDistance={10}
        showsVerticalScrollIndicator={false}
      />
      
      {editable && (
        <View style={styles.footer}>
          <Ionicons name="menu-outline" size={14} color="#94a3b8" />
          <Text style={styles.footerText}>
            Drag the handle to reorder exercises
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  listContent: {
    paddingBottom: 80,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  dragHandle: {
    padding: 4,
    marginRight: 8,
  },
  orderBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#475569',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 8,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
  },
});