import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutCreatePayload, WorkoutDifficulty, WorkoutExercise, WorkoutPlan } from '@/types/workout';
import { ExerciseItem } from './ExerciseItem';

function makeLocalExerciseId(order: number) {
  return `local-${Date.now()}-${order}-${Math.random().toString(16).slice(2, 6)}`;
}

function createExercise(order: number, source?: Partial<WorkoutExercise>): WorkoutExercise {
  return {
    _id: makeLocalExerciseId(order),
    name: source?.name ?? `Exercise ${order}`,
    muscleGroup: source?.muscleGroup ?? 'Full Body',
    equipment: source?.equipment ?? 'Bodyweight',
    sets: source?.sets ?? 3,
    reps: source?.reps ?? 10,
    restSeconds: source?.restSeconds ?? 60,
    notes: source?.notes ?? '',
    intensity: source?.intensity ?? 'moderate',
    order,
  };
}

function normalizeExercises(exercises?: WorkoutExercise[]) {
  if (!exercises?.length) {
    return [createExercise(1), createExercise(2), createExercise(3)];
  }

  return exercises
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((exercise, index) => createExercise(index + 1, exercise));
}

function normalizeExerciseForComparison(exercise: WorkoutExercise) {
  return {
    name: exercise.name.trim(),
    muscleGroup: exercise.muscleGroup.trim(),
    equipment: exercise.equipment.trim(),
    sets: Number(exercise.sets) || 0,
    reps: Number(exercise.reps) || 0,
    restSeconds: Number(exercise.restSeconds) || 0,
    notes: exercise.notes.trim(),
    intensity: exercise.intensity,
    order: exercise.order,
  };
}

function buildPlanSnapshot({
  name,
  description,
  difficulty,
  estimatedDurationMinutes,
  exercises,
}: {
  name: string;
  description: string;
  difficulty: WorkoutDifficulty;
  estimatedDurationMinutes: string;
  exercises: WorkoutExercise[];
}) {
  return {
    name: name.trim(),
    description: description.trim(),
    difficulty,
    estimatedDurationMinutes: Number(estimatedDurationMinutes) || 0,
    exercises: exercises.map(normalizeExerciseForComparison),
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
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() => normalizeExercises(initialPlan?.exercises));
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const isTablet = width >= 768;
  const initialSnapshot = useMemo(
    () =>
      initialPlan
        ? buildPlanSnapshot({
            name: initialPlan.name,
            description: initialPlan.description,
            difficulty: initialPlan.difficulty,
            estimatedDurationMinutes: String(initialPlan.estimatedDurationMinutes ?? 45),
            exercises: normalizeExercises(initialPlan.exercises),
          })
        : null,
    [initialPlan]
  );
  const currentSnapshot = useMemo(
    () =>
      buildPlanSnapshot({
        name,
        description,
        difficulty,
        estimatedDurationMinutes,
        exercises,
      }),
    [name, description, difficulty, estimatedDurationMinutes, exercises]
  );
  const hasChanges = useMemo(() => {
    if (!initialSnapshot) {
      return true;
    }

    return JSON.stringify(initialSnapshot) !== JSON.stringify(currentSnapshot);
  }, [currentSnapshot, initialSnapshot]);

  useEffect(() => {
    setName(initialPlan?.name ?? '');
    setDescription(initialPlan?.description ?? '');
    setDifficulty(initialPlan?.difficulty ?? 'beginner');
    setEstimatedDurationMinutes(String(initialPlan?.estimatedDurationMinutes ?? 45));
    setExercises(normalizeExercises(initialPlan?.exercises));
  }, [initialPlan]);

  const canSave = useMemo(() => name.trim().length > 0 && exercises.length > 0, [exercises.length, name]);
  const shouldPersistAsTemplate = useMemo(
    () => Boolean(initialPlan?.isTemplate && !initialPlan?.sourceTemplateKey),
    [initialPlan]
  );

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

  const duplicateExercise = (index: number) => {
    setExercises((current) => {
      const exerciseToCopy = current[index];
      if (!exerciseToCopy) {
        return current;
      }

      const next = [...current];
      next.splice(index + 1, 0, createExercise(current.length + 1, exerciseToCopy));
      return next.map((exercise, exerciseIndex) => ({ ...exercise, order: exerciseIndex + 1 }));
    });
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
      if (Platform.OS === 'web') {
        window.alert('Please add a workout name and at least one exercise.');
      } else {
        Alert.alert('Missing info', 'Please add a workout name and at least one exercise.');
      }
      return;
    }

    if (initialPlan && !hasChanges) {
      if (Platform.OS === 'web') {
        window.alert('Make at least one change before updating this workout.');
      } else {
        Alert.alert('No changes yet', 'Make at least one change before updating this workout.');
      }
      return;
    }

    const orderedExercises = exercises.map((exercise, index) => ({
      ...exercise,
      order: index + 1,
    }));

    await onSave(
      {
        name: name.trim(),
        description: description.trim(),
        difficulty,
        estimatedDurationMinutes: Number(estimatedDurationMinutes) || 45,
        isTemplate: shouldPersistAsTemplate,
        sourceTemplateKey: initialPlan?.sourceTemplateKey,
        exercises: orderedExercises,
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: isCompact ? 124 : 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#ecfeff', '#f8fafc', '#f1f5f9']}
          style={[styles.heroSection, isCompact && styles.heroSectionCompact]}
        >
          <View style={styles.heroPill}>
            <Ionicons name={initialPlan ? 'create-outline' : 'sparkles-outline'} size={14} color="#0f766e" />
            <Text style={styles.heroPillText}>
              {initialPlan ? 'Editing workout' : 'Building a new routine'}
            </Text>
          </View>
          <Text style={[styles.title, { fontSize: isCompact ? 24 : isTablet ? 32 : 28 }]}>
            {initialPlan ? 'Edit Workout' : 'Create Custom Workout'}
          </Text>
          <Text style={styles.subtitle}>
            {initialPlan
              ? 'Make your changes, then update the workout once it is ready.'
              : 'Add a name, choose a difficulty, and shape the exercise list to fit your goal.'}
          </Text>
          {initialPlan?.sourceTemplateKey ? (
            <View style={styles.templateNote}>
              <Ionicons name="layers-outline" size={14} color="#0d9488" />
              <Text style={styles.templateNoteText}>Started from a popular template</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.formSection}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Basic Information</Text>
                <Text style={styles.cardSubtitle}>Keep the workout name and description clear.</Text>
              </View>
            </View>

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

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Difficulty Level</Text>
                <Text style={styles.cardSubtitle}>Match the intensity to the user&apos;s current pace.</Text>
              </View>
            </View>
            <View style={[styles.difficultyRow, isCompact && styles.difficultyRowCompact]}>
              {difficultyOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setDifficulty(option.value as WorkoutDifficulty)}
                  style={[
                    styles.difficultyOption,
                    difficulty === option.value && { borderColor: option.color, backgroundColor: `${option.color}10` },
                  ]}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={difficulty === option.value ? option.color : '#64748b'}
                  />
                  <Text style={[styles.difficultyLabel, difficulty === option.value && { color: option.color }]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Estimated Duration</Text>
                <Text style={styles.cardSubtitle}>A realistic estimate helps keep the routine manageable.</Text>
              </View>
            </View>
            <View style={[styles.durationWrapper, isCompact && styles.durationWrapperCompact]}>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setEstimatedDurationMinutes}
                style={styles.durationInput}
                value={estimatedDurationMinutes}
              />
              <Text style={styles.durationUnit}>minutes</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.exercisesHeader}>
              <View>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <Text style={styles.sectionSubtitle}>
                  {exercises.length} exercises added. Drag, duplicate, or remove as needed.
                </Text>
              </View>
              <Pressable onPress={addExercise} style={styles.secondaryActionButton}>
                <Ionicons name="add" size={18} color="#0d9488" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.quickActionsRow}>
              <Pressable onPress={addExercise} style={styles.quickActionButton}>
                <Ionicons name="add-circle-outline" size={18} color="#0d9488" />
                <Text style={styles.quickActionText}>Add blank exercise</Text>
              </Pressable>
              <Pressable onPress={() => duplicateExercise(exercises.length - 1)} style={styles.quickActionButton}>
                <Ionicons name="copy-outline" size={18} color="#0d9488" />
                <Text style={styles.quickActionText}>Duplicate last</Text>
              </Pressable>
            </View>

            {exercises.length === 0 ? (
              <View style={styles.emptyExercisesState}>
                <Ionicons name="barbell-outline" size={44} color="#cbd5e1" />
                <Text style={styles.emptyExercisesTitle}>No exercises yet</Text>
                <Text style={styles.emptyExercisesText}>
                  Add one or duplicate the last exercise to build the workout.
                </Text>
              </View>
            ) : (
              exercises.map((exercise, index) => (
                <ExerciseItem
                  key={exercise._id ?? `exercise-${index}`}
                  exercise={exercise}
                  index={index}
                  onEdit={updateExercise}
                  onDuplicate={duplicateExercise}
                  onRemove={removeExercise}
                  onReorder={reorderExercises}
                  total={exercises.length}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, isCompact && styles.stickyFooterCompact]}>
        <View style={styles.footerCard}>
          {initialPlan && !hasChanges ? (
            <View style={styles.footerHint}>
              <Ionicons name="information-circle-outline" size={18} color="#0d9488" />
              <Text style={styles.footerHintText}>Make a change to enable the update button.</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!canSave || saving}
            >
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
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  heroSection: {
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroSectionCompact: {
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  templateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  templateNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
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
  cardHeaderRow: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
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
  difficultyRowCompact: {
    flexDirection: 'column',
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
  durationWrapperCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
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
  exerciseActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  quickActionButton: {
    flexGrow: 1,
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  emptyExercisesState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyExercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyExercisesText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    textAlign: 'center',
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
  stickyFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
  stickyFooterCompact: {
    left: 12,
    right: 12,
    bottom: 10,
  },
  footerCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  footerHintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
