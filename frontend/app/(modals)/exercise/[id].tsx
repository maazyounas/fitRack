import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import {
  addExerciseComment,
  createExercise,
  deleteExercise,
  fetchExercise,
  rateExercise,
  saveExerciseNotes,
  setExerciseFavorite,
  updateExercise,
} from '@/services/api/exercise';
import { useAuthStore } from '@/store/authStore';
import { Exercise, ExercisePayload } from '@/types/exercise';

type FormState = {
  name: string;
  description: string;
  muscleGroup: string;
  targetMuscles: string;
  difficulty: Exercise['difficulty'];
  equipment: string;
  instructions: string;
  videoUrls: string;
};

const difficultyOptions: Exercise['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

function emptyForm(): FormState {
  return {
    name: '',
    description: '',
    muscleGroup: '',
    targetMuscles: '',
    difficulty: 'beginner',
    equipment: '',
    instructions: '',
    videoUrls: '',
  };
}

function buildFormState(exercise: Exercise): FormState {
  return {
    name: exercise.name,
    description: exercise.description,
    muscleGroup: exercise.muscleGroup,
    targetMuscles: exercise.targetMuscles.join(', '),
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    instructions: exercise.instructions.join('\n'),
    videoUrls: exercise.demoVideos.map((video) => video.url).join('\n'),
  };
}

function toPayload(form: FormState): ExercisePayload {
  const videos = form.videoUrls
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((url, index) => ({
      title: `Demo Video ${index + 1}`,
      url,
    }));

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    muscleGroup: form.muscleGroup.trim(),
    targetMuscles: form.targetMuscles
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
    difficulty: form.difficulty,
    equipment: form.equipment.trim() || 'Bodyweight',
    instructions: form.instructions
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean),
    demoVideos: videos,
  };
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tokens, user } = useAuthStore();
  const isNew = id === 'new';
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm());

  const loadExercise = useCallback(async () => {
    if (!tokens?.accessToken || !id || isNew) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchExercise(tokens.accessToken, id);
      setExercise(response.exercise);
      setNotesDraft(response.exercise.notes);
      setForm(buildFormState(response.exercise));
    } finally {
      setIsLoading(false);
    }
  }, [id, isNew, tokens?.accessToken]);

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm());
      setNotesDraft('');
      setExercise(null);
      setIsLoading(false);
      return;
    }

    void loadExercise().catch((error) =>
      Alert.alert('Exercise failed', error instanceof Error ? error.message : 'Please try again.')
    );
  }, [isNew, loadExercise]);

  const ratingText = useMemo(() => {
    if (!exercise) {
      return 'No ratings yet';
    }

    return `${exercise.ratingAverage.toFixed(1)} stars from ${exercise.ratingCount} ratings`;
  }, [exercise]);

  const submitComment = async () => {
    if (!tokens?.accessToken || !exercise) {
      return;
    }

    try {
      const response = await addExerciseComment(tokens.accessToken, exercise.id, commentDraft);
      setExercise(response.exercise);
      setCommentDraft('');
    } catch (error) {
      Alert.alert('Comment failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const submitNotes = async () => {
    if (!tokens?.accessToken || !exercise) {
      return;
    }

    try {
      const response = await saveExerciseNotes(tokens.accessToken, exercise.id, notesDraft);
      setExercise(response.exercise);
      setNotesDraft(response.exercise.notes);
      Alert.alert('Notes saved', 'Your exercise notes were updated.');
    } catch (error) {
      Alert.alert('Notes failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const toggleFavorite = async () => {
    if (!tokens?.accessToken || !exercise) {
      return;
    }

    try {
      const response = await setExerciseFavorite(tokens.accessToken, exercise.id, !exercise.isFavorite);
      setExercise(response.exercise);
    } catch (error) {
      Alert.alert('Favorite failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const submitRating = async (score: number) => {
    if (!tokens?.accessToken || !exercise) {
      return;
    }

    try {
      const response = await rateExercise(tokens.accessToken, exercise.id, score);
      setExercise(response.exercise);
    } catch (error) {
      Alert.alert('Rating failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const submitAdminForm = async () => {
    if (!tokens?.accessToken || !user?.isAdmin) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = toPayload(form);
      const response = isNew
        ? await createExercise(tokens.accessToken, payload)
        : await updateExercise(tokens.accessToken, id, payload);

      setExercise(response.exercise);
      setForm(buildFormState(response.exercise));
      setNotesDraft(response.exercise.notes);
      if (isNew) {
        router.replace(`/(modals)/exercise/${response.exercise.id}` as never);
      } else {
        Alert.alert('Exercise updated', 'Your exercise changes were saved.');
      }
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeExercise = async () => {
    if (!tokens?.accessToken || !exercise) {
      return;
    }

    try {
      await deleteExercise(tokens.accessToken, exercise.id);
      Alert.alert('Exercise deleted', 'The exercise was removed from the library.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons color="#0f172a" name="arrow-back" size={20} />
        </Pressable>
        <Text style={styles.title}>{isNew ? 'Add Exercise' : exercise?.name ?? 'Exercise Detail'}</Text>
        {!isNew && exercise ? (
          <Pressable onPress={() => void toggleFavorite()} style={styles.iconButton}>
            <Ionicons color={exercise.isFavorite ? '#dc2626' : '#0f172a'} name="heart" size={20} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}
      </View>

      {isLoading ? <Text style={styles.emptyText}>Loading exercise details...</Text> : null}

      {!isLoading && exercise ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroMeta}>
              {exercise.muscleGroup} | {exercise.difficulty} | {exercise.equipment}
            </Text>
            <Text style={styles.heroDescription}>{exercise.description}</Text>
            <Text style={styles.heroStat}>{ratingText}</Text>
            <Text style={styles.heroStat}>{exercise.favoriteCount} people saved this exercise</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Target Muscles</Text>
            <View style={styles.badgeRow}>
              {exercise.targetMuscles.map((muscle) => (
                <View key={muscle} style={styles.badge}>
                  <Text style={styles.badgeText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How To Perform It</Text>
            {exercise.instructions.map((step, index) => (
              <View key={`${exercise.id}-step-${index}`} style={styles.instructionRow}>
                <View style={styles.instructionIndex}>
                  <Text style={styles.instructionIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Demo Videos</Text>
            {exercise.demoVideos.length ? (
              exercise.demoVideos.map((video) => (
                <Pressable
                  key={video.url}
                  onPress={() => void Linking.openURL(video.url)}
                  style={styles.videoButton}
                >
                  <Ionicons color="#0f766e" name="play-circle" size={20} />
                  <Text style={styles.videoText}>{video.title}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No demo videos added yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((score) => (
                <Pressable
                  key={score}
                  onPress={() => void submitRating(score)}
                  style={styles.starButton}
                >
                  <Ionicons
                    color={score <= (exercise.currentUserRating ?? 0) ? '#f59e0b' : '#cbd5e1'}
                    name="star"
                    size={28}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <TextInput
              multiline
              onChangeText={setNotesDraft}
              placeholder="Track cues, load progress, or movement reminders"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.multilineInput]}
              textAlignVertical="top"
              value={notesDraft}
            />
            <Button label="Save Notes" onPress={submitNotes} tone="secondary" />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <TextInput
              multiline
              onChangeText={setCommentDraft}
              placeholder="Share form cues, substitutions, or feedback"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.commentInput]}
              textAlignVertical="top"
              value={commentDraft}
            />
            <Button label="Post Comment" onPress={submitComment} />
            <View style={styles.commentList}>
              {exercise.comments.length ? (
                exercise.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <Text style={styles.commentAuthor}>{comment.userName}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No comments yet. Start the discussion.</Text>
              )}
            </View>
          </View>
        </>
      ) : null}

      {user?.isAdmin ? (
        <View style={styles.adminCard}>
          <Text style={styles.sectionTitle}>{isNew ? 'Create Exercise' : 'Admin Editor'}</Text>
          <Field label="Name" value={form.name} onChangeText={(value) => setForm((state) => ({ ...state, name: value }))} />
          <Field
            label="Description"
            multiline
            value={form.description}
            onChangeText={(value) => setForm((state) => ({ ...state, description: value }))}
          />
          <Field
            label="Muscle Group"
            value={form.muscleGroup}
            onChangeText={(value) => setForm((state) => ({ ...state, muscleGroup: value }))}
          />
          <Field
            label="Target Muscles"
            helper="Separate values with commas"
            value={form.targetMuscles}
            onChangeText={(value) => setForm((state) => ({ ...state, targetMuscles: value }))}
          />
          <View style={styles.field}>
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.filterRow}>
              {difficultyOptions.map((option) => {
                const isActive = option === form.difficulty;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setForm((state) => ({ ...state, difficulty: option }))}
                    style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                  >
                    <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Field
            label="Equipment"
            value={form.equipment}
            onChangeText={(value) => setForm((state) => ({ ...state, equipment: value }))}
          />
          <Field
            label="Instructions"
            helper="Use one line per step"
            multiline
            value={form.instructions}
            onChangeText={(value) => setForm((state) => ({ ...state, instructions: value }))}
          />
          <Field
            label="Demo Video URLs"
            helper="Use one URL per line"
            multiline
            value={form.videoUrls}
            onChangeText={(value) => setForm((state) => ({ ...state, videoUrls: value }))}
          />
          <Button
            label={isNew ? 'Create Exercise' : 'Save Exercise'}
            loading={isSaving}
            onPress={submitAdminForm}
          />
          {!isNew && exercise ? (
            <Button
              label="Delete Exercise"
              onPress={() =>
                Alert.alert('Delete exercise', 'This removes the exercise from the library.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => void removeExercise() },
                ])
              }
              tone="danger"
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  helper?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline ? styles.multilineInput : null]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: 20,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconSpacer: {
    width: 42,
  },
  title: {
    color: '#0f172a',
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  heroMeta: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  heroDescription: {
    color: '#164e63',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  heroStat: {
    color: '#155e75',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  adminCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    gap: 12,
    marginBottom: 16,
    padding: 18,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  instructionIndex: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  instructionIndexText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  instructionText: {
    color: '#334155',
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  videoButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    padding: 14,
  },
  videoText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    paddingVertical: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  multilineInput: {
    minHeight: 110,
  },
  commentInput: {
    marginBottom: 12,
    minHeight: 88,
  },
  commentList: {
    marginTop: 14,
  },
  commentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
  },
  commentAuthor: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  commentDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  commentText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    color: '#64748b',
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#f8fafc',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
});
