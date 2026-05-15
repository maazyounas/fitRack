import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      Alert.alert('Missing info', 'Please add a workout name and at least one exercise.');
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

  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner', icon: 'happy-outline', color: '#10b981' },
    { value: 'intermediate', label: 'Intermediate', icon: 'fitness-outline', color: '#f59e0b' },
    { value: 'advanced', label: 'Advanced', icon: 'flash-outline', color: '#ef4444' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.heroSection}>
        <Text style={styles.title}>{initialPlan ? 'Edit Workout' : 'Create Custom Workout'}</Text>
        <Text style={styles.subtitle}>
          {initialPlan 
            ? 'Modify your existing workout routine' 
            : 'Build your perfect routine by adding exercises and customizing details'}
        </Text>
      </LinearGradient>

      <View style={styles.formSection}>
        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="create-outline" size={18} color="#64748b" />
            <TextInput
              onChangeText={setName}
              placeholder="Workout name"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={name}
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Ionicons name="document-text-outline" size={18} color="#64748b" />
            <TextInput
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={description}
            />
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {difficultyOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setDifficulty(option.value as WorkoutDifficulty)}
                style={[
                  styles.difficultyOption,
                  difficulty === option.value && { borderColor: option.color, backgroundColor: `${option.color}10` },
                ]}>
                <Ionicons name={option.icon as any} size={24} color={difficulty === option.value ? option.color : '#64748b'} />
                <Text style={[styles.difficultyLabel, difficulty === option.value && { color: option.color }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estimated Duration</Text>
          <View style={styles.durationWrapper}>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setEstimatedDurationMinutes}
              style={styles.durationInput}
              value={estimatedDurationMinutes}
            />
            <Text style={styles.durationUnit}>minutes</Text>
          </View>
        </View>

        {/* Exercises Section */}
        <View style={styles.exercisesHeader}>
          <View>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <Text style={styles.sectionSubtitle}>{exercises.length} exercises added</Text>
          </View>
          <Pressable onPress={addExercise} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#0d9488" />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
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

        {/* Save Button */}
        <Pressable style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]} onPress={handleSave}>
          <LinearGradient
            colors={['#0d9488', '#0f766e']}
            style={styles.saveButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            {saving ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Text style={styles.saveButtonText}>
                  {initialPlan ? 'Update Workout' : 'Save Workout'}
                </Text>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  heroSection: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  formSection: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#1e293b',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  difficultyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  durationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d9488',
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});