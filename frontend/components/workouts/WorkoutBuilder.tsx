import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { WorkoutCreatePayload, WorkoutDifficulty, WorkoutExercise, WorkoutPlan } from '@/types/workout';
import { ExerciseItem } from './ExerciseItem';

function createExercise(order: number): WorkoutExercise {
  return {
    name: `Exercise ${order}`,
    muscleGroup: 'Full Body',
    equipment: 'Bodyweight',
    sets: 3,
    reps: 10,
    restSeconds: 60,
    notes: '',
    intensity: 'moderate',
    order,
  };
}

export function WorkoutBuilder({
  initialPlan,
  onSave,
  saving,
}: {
  initialPlan?: WorkoutPlan | null;
  onSave: (payload: WorkoutCreatePayload, planId?: string) => Promise<void>;
  saving?: boolean;
}) {
  const [name, setName] = useState(initialPlan?.name ?? '');
  const [description, setDescription] = useState(initialPlan?.description ?? '');
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty>(initialPlan?.difficulty ?? 'beginner');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(
    String(initialPlan?.estimatedDurationMinutes ?? 45)
  );
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    initialPlan?.exercises?.length
      ? initialPlan.exercises
      : [createExercise(1), createExercise(2), createExercise(3)]
  );

  const canSave = useMemo(() => name.trim().length > 0 && exercises.length > 0, [exercises.length, name]);

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: string) => {
    setExercises((current) =>
      current.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== index) {
          return exercise;
        }

        if (field === 'sets' || field === 'reps' || field === 'restSeconds' || field === 'order') {
          return { ...exercise, [field]: Number(value) || 0 };
        }

        return { ...exercise, [field]: value };
      })
    );
  };

  const addExercise = () => {
    setExercises((current) => [...current, createExercise(current.length + 1)]);
  };

  const removeExercise = (index: number) => {
    setExercises((current) =>
      current
        .filter((_, exerciseIndex) => exerciseIndex !== index)
        .map((exercise, exerciseIndex) => ({ ...exercise, order: exerciseIndex + 1 }))
    );
  };

  const reorderExercises = (from: number, to: number) => {
    setExercises((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next.map((exercise, index) => ({ ...exercise, order: index + 1 }));
    });
  };

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Add details', 'A workout name and at least one exercise are required.');
      return;
    }

    await onSave(
      {
        name: name.trim(),
        description: description.trim(),
        difficulty,
        estimatedDurationMinutes: Number(estimatedDurationMinutes) || 45,
        isTemplate: initialPlan?.isTemplate,
        sourceTemplateKey: initialPlan?.sourceTemplateKey,
        exercises,
      },
      initialPlan?.id
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{initialPlan ? 'Edit workout' : 'Create a custom routine'}</Text>
      <Text style={styles.subtitle}>
        Build your plan, drag exercises to reorder them, and save it for scheduling.
      </Text>

      <View style={styles.card}>
        <TextInput
          onChangeText={setName}
          placeholder="Routine name"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={name}
        />
        <TextInput
          onChangeText={setDescription}
          placeholder="Goal, split, or focus"
          placeholderTextColor="#64748b"
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
        />
        <View style={styles.row}>
          {(['beginner', 'intermediate', 'advanced'] as WorkoutDifficulty[]).map((level) => (
            <Button
              key={level}
              label={level}
              onPress={() => setDifficulty(level)}
              tone={difficulty === level ? 'primary' : 'secondary'}
            />
          ))}
        </View>
        <TextInput
          keyboardType="number-pad"
          onChangeText={setEstimatedDurationMinutes}
          placeholder="Duration in minutes"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={estimatedDurationMinutes}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        <Button label="Add Exercise" onPress={addExercise} tone="secondary" />
      </View>

      {exercises.map((exercise, index) => (
        <ExerciseItem
          key={`${exercise.name}-${index}`}
          exercise={exercise}
          index={index}
          onEdit={updateExercise}
          onRemove={removeExercise}
          onReorder={reorderExercises}
          total={exercises.length}
        />
      ))}

      <Button label={initialPlan ? 'Update Workout' : 'Save Workout'} loading={saving} onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: 20,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#e0f2fe',
    borderRadius: 24,
    marginBottom: 20,
    padding: 18,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    color: '#0f172a',
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
});
