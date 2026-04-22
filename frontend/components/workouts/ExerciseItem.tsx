import { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { WorkoutExercise } from '@/types/workout';

type ExerciseItemProps = {
  exercise: WorkoutExercise;
  index: number;
  total: number;
  onEdit: (index: number, field: keyof WorkoutExercise, value: string) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
};

const ITEM_HEIGHT = 168;

export function ExerciseItem({
  exercise,
  index,
  total,
  onEdit,
  onRemove,
  onReorder,
}: ExerciseItemProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dy: translateY }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_event, gesture) => {
      const offset = Math.round(gesture.dy / ITEM_HEIGHT);
      const nextIndex = Math.max(0, Math.min(total - 1, index + offset));
      translateY.setValue(0);
      if (nextIndex !== index) {
        onReorder(index, nextIndex);
      }
    },
  });

  return (
    <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{exercise.name || `Exercise ${index + 1}`}</Text>
          <Text style={styles.meta}>
            {exercise.muscleGroup} | {exercise.equipment} | {exercise.intensity}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable {...responder.panHandlers} style={styles.dragHandle}>
            <Text style={styles.dragText}>Drag</Text>
          </Pressable>
          <Pressable onPress={() => onRemove(index)} style={styles.removeButton}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.formGrid}>
        <TextInput
          onChangeText={(value) => onEdit(index, 'name', value)}
          placeholder="Exercise name"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={exercise.name}
        />
        <TextInput
          onChangeText={(value) => onEdit(index, 'muscleGroup', value)}
          placeholder="Muscle group"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={exercise.muscleGroup}
        />
        <TextInput
          onChangeText={(value) => onEdit(index, 'equipment', value)}
          placeholder="Equipment"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={exercise.equipment}
        />
      </View>

      <View style={styles.quickStats}>
        <Pressable onPress={() => onEdit(index, 'sets', String(exercise.sets + 1))} style={styles.statButton}>
          <Text style={styles.statLabel}>Sets</Text>
          <Text style={styles.statValue}>{exercise.sets}</Text>
        </Pressable>
        <Pressable onPress={() => onEdit(index, 'reps', String(exercise.reps + 1))} style={styles.statButton}>
          <Text style={styles.statLabel}>Reps</Text>
          <Text style={styles.statValue}>{exercise.reps}</Text>
        </Pressable>
        <Pressable
          onPress={() => onEdit(index, 'restSeconds', String(exercise.restSeconds + 15))}
          style={styles.statButton}
        >
          <Text style={styles.statLabel}>Rest</Text>
          <Text style={styles.statValue}>{exercise.restSeconds}s</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#dbeafe',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  meta: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  dragHandle: {
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dragText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  removeButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  formGrid: {
    gap: 10,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    flex: 1,
    padding: 10,
  },
  statLabel: {
    color: '#475569',
    fontSize: 12,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
});
