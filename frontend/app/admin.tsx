import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Fonts } from '@/constants/theme';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useFontScale } from '@/hooks/useFontScale';
import { fetchAdminDashboard, disableAdminUser, deleteAdminCommunityComment, deleteAdminCommunityPost } from '@/services/api/admin';
import { deleteExercise, updateExercise } from '@/services/api/exercise';
import { useAuthStore } from '@/store/authStore';
import { AdminDashboard, AdminExercise, AdminUser } from '@/types/admin';
import { ExercisePayload } from '@/types/exercise';

type StatCardProps = {
  label: string;
  value: string;
  note: string;
  tint: string;
  palette: ReturnType<typeof useAppPalette>;
  fontScale: number;
};

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not available';
  }

  return new Date(value).toLocaleString();
}

function StatCard({ label, value, note, tint, palette, fontScale }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name="pulse" size={18} color="#fff" />
      </View>
      <Text style={[styles.statLabel, { color: palette.mutedText, fontSize: 13 * fontScale }]}>{label}</Text>
      <Text style={[styles.statValue, { color: palette.text, fontSize: 26 * fontScale }]}>{value}</Text>
      <Text style={[styles.statNote, { color: palette.mutedText, fontSize: 13 * fontScale }]}>{note}</Text>
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  palette,
  fontScale,
}: {
  eyebrow: string;
  title: string;
  description: string;
  palette: ReturnType<typeof useAppPalette>;
  fontScale: number;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionEyebrow, { color: palette.tint, fontSize: 12 * fontScale }]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 24 * fontScale }]}>{title}</Text>
      <Text style={[styles.sectionDescription, { color: palette.mutedText, fontSize: 14 * fontScale }]}>
        {description}
      </Text>
    </View>
  );
}

function AdminAction({
  label,
  onPress,
  tone,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone: 'neutral' | 'danger' | 'primary';
  disabled?: boolean;
}) {
  const tones = {
    neutral: { backgroundColor: '#e2e8f0', color: '#0f172a' },
    primary: { backgroundColor: '#0f766e', color: '#f8fafc' },
    danger: { backgroundColor: '#b91c1c', color: '#ffffff' },
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.inlineAction,
        { backgroundColor: tones[tone].backgroundColor, opacity: pressed || disabled ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.inlineActionLabel, { color: tones[tone].color }]}>{label}</Text>
    </Pressable>
  );
}

function buildExerciseForm(exercise: AdminExercise): ExercisePayload {
  return {
    name: exercise.name,
    description: exercise.description,
    muscleGroup: exercise.muscleGroup,
    targetMuscles: exercise.targetMuscles,
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    instructions: exercise.instructions,
    demoVideos: exercise.demoVideos,
  };
}

export default function AdminScreen() {
  const router = useRouter();
  const palette = useAppPalette();
  const fontScale = useFontScale();
  const { width } = useWindowDimensions();
  const { user, tokens } = useAuthStore();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseForm, setExerciseForm] = useState<ExercisePayload | null>(null);

  const isWide = width >= 1100;
  const isMedium = width >= 820;

  const selectedExercise = useMemo(
    () => dashboard?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null,
    [dashboard?.exercises, selectedExerciseId]
  );

  const loadDashboard = async () => {
    if (!tokens?.accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchAdminDashboard(tokens.accessToken);
      setDashboard(response);
      if (!selectedExerciseId && response.exercises[0]) {
        setSelectedExerciseId(response.exercises[0].id);
        setExerciseForm(buildExerciseForm(response.exercises[0]));
      }
      if (selectedExerciseId) {
        const updatedExercise = response.exercises.find((exercise) => exercise.id === selectedExerciseId);
        if (updatedExercise) {
          setExerciseForm(buildExerciseForm(updatedExercise));
        }
      }
    } catch (error) {
      Alert.alert('Admin hub unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.isAdmin) {
      router.replace('/(tabs)/home');
      return;
    }

    void loadDashboard();
  }, [router, tokens?.accessToken, user]);

  if (user && !user.isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.unauthorizedText}>Admin access is restricted to administrators only.</Text>
      </View>
    );
  }

  useEffect(() => {
    if (!selectedExercise && dashboard?.exercises?.length) {
      const nextExercise = dashboard.exercises[0];
      setSelectedExerciseId(nextExercise.id);
      setExerciseForm(buildExerciseForm(nextExercise));
    }
  }, [dashboard?.exercises, selectedExercise]);

  if (!user) {
    return null;
  }

  if (!user.isAdmin) {
    return null;
  }

  const handleDisableUser = (member: AdminUser) => {
    if (!tokens?.accessToken) {
      return;
    }

    Alert.alert('Disable account', `Disable ${member.profile.name}'s access and revoke active sessions?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disable',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            setIsSaving(true);
            try {
              await disableAdminUser(tokens.accessToken, member.id);
              await loadDashboard();
            } catch (error) {
              Alert.alert('Disable failed', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setIsSaving(false);
            }
          })(),
      },
    ]);
  };

  const handleDeleteExercise = (exercise: AdminExercise) => {
    if (!tokens?.accessToken) {
      return;
    }

    Alert.alert('Delete exercise', `Delete ${exercise.name} from the library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            setIsSaving(true);
            try {
              await deleteExercise(tokens.accessToken, exercise.id);
              if (selectedExerciseId === exercise.id) {
                setSelectedExerciseId(null);
                setExerciseForm(null);
              }
              await loadDashboard();
            } catch (error) {
              Alert.alert('Delete failed', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setIsSaving(false);
            }
          })(),
      },
    ]);
  };

  const handleSaveExercise = async () => {
    if (!tokens?.accessToken || !selectedExercise || !exerciseForm) {
      return;
    }

    setIsSaving(true);
    try {
      await updateExercise(tokens.accessToken, selectedExercise.id, exerciseForm);
      await loadDashboard();
      Alert.alert('Saved', 'Exercise content updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    if (!tokens?.accessToken) {
      return;
    }

    Alert.alert('Delete community post', 'This permanently removes the post and its discussion.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            setIsSaving(true);
            try {
              await deleteAdminCommunityPost(tokens.accessToken, postId);
              await loadDashboard();
            } catch (error) {
              Alert.alert('Delete failed', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setIsSaving(false);
            }
          })(),
      },
    ]);
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    if (!tokens?.accessToken) {
      return;
    }

    Alert.alert('Delete comment', 'Remove this comment from the community thread?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            setIsSaving(true);
            try {
              await deleteAdminCommunityComment(tokens.accessToken, postId, commentId);
              await loadDashboard();
            } catch (error) {
              Alert.alert('Delete failed', error instanceof Error ? error.message : 'Please try again.');
            } finally {
              setIsSaving(false);
            }
          })(),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={palette.background === '#151718' ? ['#0b1220', '#134e4a', '#1f2937'] : ['#fff7ed', '#d1fae5', '#e0f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: palette.border }]}
      >
        <View style={[styles.heroBadge, { backgroundColor: 'rgba(15, 118, 110, 0.12)' }]}>
          <Text style={[styles.heroBadgeText, { color: palette.tint, fontSize: 12 * fontScale }]}>WEB ADMIN HUB</Text>
        </View>
        <Text style={[styles.heroTitle, { color: palette.text, fontSize: 34 * fontScale }]}>Operate FITRACK from one control room</Text>
        <Text style={[styles.heroCopy, { color: palette.mutedText, fontSize: 15 * fontScale }]}>
          Review accounts, clean up exercises, moderate the community, and inspect recent API activity without leaving the web app.
        </Text>
        <View style={[styles.heroMetaRow, !isMedium ? styles.heroMetaStack : null]}>
          <View style={[styles.heroMetaCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.heroMetaLabel, { color: palette.mutedText, fontSize: 12 * fontScale }]}>Signed in as</Text>
            <Text style={[styles.heroMetaValue, { color: palette.text, fontSize: 16 * fontScale }]}>{user.profile.name}</Text>
          </View>
          <View style={[styles.heroMetaCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.heroMetaLabel, { color: palette.mutedText, fontSize: 12 * fontScale }]}>Surface</Text>
            <Text style={[styles.heroMetaValue, { color: palette.text, fontSize: 16 * fontScale }]}>
              {Platform.OS === 'web' ? 'Web dashboard' : 'Mobile fallback'}
            </Text>
          </View>
          <View style={[styles.heroMetaCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.heroMetaLabel, { color: palette.mutedText, fontSize: 12 * fontScale }]}>Refresh</Text>
            <Button label="Reload" onPress={() => void loadDashboard()} loading={isLoading} tone="secondary" />
          </View>
        </View>
      </LinearGradient>

      <SectionTitle
        eyebrow="Analytics"
        title="Operational snapshot"
        description="High-signal numbers for accounts, engagement, and live activity."
        palette={palette}
        fontScale={fontScale}
      />

      <View style={[styles.statsGrid, isWide ? styles.statsGridWide : null]}>
        <StatCard
          label="Total users"
          value={String(dashboard?.analytics.users.total ?? 0)}
          note={`${dashboard?.analytics.users.active ?? 0} active, ${dashboard?.analytics.users.disabled ?? 0} disabled`}
          tint="#0f766e"
          palette={palette}
          fontScale={fontScale}
        />
        <StatCard
          label="Exercise library"
          value={String(dashboard?.analytics.content.exercises ?? 0)}
          note={`${dashboard?.exercises.length ?? 0} entries loaded into the hub`}
          tint="#1d4ed8"
          palette={palette}
          fontScale={fontScale}
        />
        <StatCard
          label="Community"
          value={String(dashboard?.analytics.content.communityPosts ?? 0)}
          note={`${dashboard?.analytics.content.communityComments ?? 0} comments moderated-ready`}
          tint="#c2410c"
          palette={palette}
          fontScale={fontScale}
        />
        <StatCard
          label="Active sessions"
          value={String(dashboard?.analytics.content.activeSessions ?? 0)}
          note={`${dashboard?.analytics.users.admins ?? 0} admin accounts in the system`}
          tint="#7c3aed"
          palette={palette}
          fontScale={fontScale}
        />
      </View>

      <SectionTitle
        eyebrow="Features"
        title="Users and content"
        description="Disable accounts quickly and keep the exercise library up to date."
        palette={palette}
        fontScale={fontScale}
      />

      <View style={[styles.twoColumn, isWide ? styles.twoColumnWide : null]}>
        <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.panelTitle, { color: palette.text, fontSize: 20 * fontScale }]}>Users</Text>
          {dashboard?.users.map((member) => (
            <View key={member.id} style={[styles.listRow, { borderBottomColor: palette.border }]}>
              <View style={styles.listContent}>
                <Text style={[styles.listTitle, { color: palette.text, fontSize: 16 * fontScale }]}>
                  {member.profile.name}
                </Text>
                <Text style={[styles.listMeta, { color: palette.mutedText, fontSize: 13 * fontScale }]}>
                  {member.email || member.phone || 'No contact saved'}
                </Text>
                <Text style={[styles.listMeta, { color: palette.mutedText, fontSize: 12 * fontScale }]}>
                  Joined {formatDate(member.createdAt)} | Last login {formatDate(member.lastLoginAt)}
                </Text>
              </View>
              <View style={styles.listActions}>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: member.deactivatedAt ? '#fee2e2' : member.isAdmin ? '#dbeafe' : '#dcfce7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: member.deactivatedAt ? '#b91c1c' : member.isAdmin ? '#1d4ed8' : '#15803d' },
                    ]}
                  >
                    {member.deactivatedAt ? 'Disabled' : member.isAdmin ? 'Admin' : 'Active'}
                  </Text>
                </View>
                {!member.deactivatedAt && !member.isAdmin ? (
                  <AdminAction label="Disable" onPress={() => handleDisableUser(member)} tone="danger" disabled={isSaving} />
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.panelTitle, { color: palette.text, fontSize: 20 * fontScale }]}>Exercise content</Text>
          <View style={[styles.exerciseLayout, isWide ? styles.exerciseLayoutWide : null]}>
            <View style={styles.exerciseList}>
              {dashboard?.exercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  onPress={() => {
                    setSelectedExerciseId(exercise.id);
                    setExerciseForm(buildExerciseForm(exercise));
                  }}
                  style={[
                    styles.exercisePicker,
                    {
                      backgroundColor: selectedExerciseId === exercise.id ? 'rgba(15,118,110,0.10)' : palette.background,
                      borderColor: selectedExerciseId === exercise.id ? palette.tint : palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.exerciseName, { color: palette.text, fontSize: 15 * fontScale }]}>{exercise.name}</Text>
                  <Text style={[styles.exerciseMeta, { color: palette.mutedText, fontSize: 12 * fontScale }]}>
                    {exercise.muscleGroup} | {exercise.difficulty} | {exercise.commentCount} comments
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.editorPane}>
              {selectedExercise && exerciseForm ? (
                <>
                  <Text style={[styles.editorTitle, { color: palette.text, fontSize: 18 * fontScale }]}>
                    Editing {selectedExercise.name}
                  </Text>
                  <TextInput
                    placeholder="Exercise name"
                    placeholderTextColor={palette.mutedText}
                    style={[styles.field, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                    value={exerciseForm.name}
                    onChangeText={(value) => setExerciseForm((current) => (current ? { ...current, name: value } : current))}
                  />
                  <TextInput
                    placeholder="Description"
                    placeholderTextColor={palette.mutedText}
                    multiline
                    style={[
                      styles.field,
                      styles.multilineField,
                      { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
                    ]}
                    value={exerciseForm.description}
                    onChangeText={(value) =>
                      setExerciseForm((current) => (current ? { ...current, description: value } : current))
                    }
                  />
                  <View style={[styles.formRow, !isMedium ? styles.formRowStack : null]}>
                    <TextInput
                      placeholder="Muscle group"
                      placeholderTextColor={palette.mutedText}
                      style={[
                        styles.field,
                        styles.formField,
                        { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
                      ]}
                      value={exerciseForm.muscleGroup}
                      onChangeText={(value) =>
                        setExerciseForm((current) => (current ? { ...current, muscleGroup: value } : current))
                      }
                    />
                    <TextInput
                      placeholder="Equipment"
                      placeholderTextColor={palette.mutedText}
                      style={[
                        styles.field,
                        styles.formField,
                        { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
                      ]}
                      value={exerciseForm.equipment}
                      onChangeText={(value) =>
                        setExerciseForm((current) => (current ? { ...current, equipment: value } : current))
                      }
                    />
                  </View>
                  <TextInput
                    placeholder="Difficulty: beginner, intermediate, advanced"
                    placeholderTextColor={palette.mutedText}
                    style={[styles.field, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                    value={exerciseForm.difficulty}
                    onChangeText={(value) =>
                      setExerciseForm((current) =>
                        current ? { ...current, difficulty: value as ExercisePayload['difficulty'] } : current
                      )
                    }
                  />
                  <TextInput
                    placeholder="Target muscles, comma separated"
                    placeholderTextColor={palette.mutedText}
                    style={[styles.field, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                    value={exerciseForm.targetMuscles.join(', ')}
                    onChangeText={(value) =>
                      setExerciseForm((current) =>
                        current
                          ? {
                              ...current,
                              targetMuscles: value
                                .split(',')
                                .map((entry) => entry.trim())
                                .filter(Boolean),
                            }
                          : current
                      )
                    }
                  />
                  <TextInput
                    placeholder="Instructions, one per line"
                    placeholderTextColor={palette.mutedText}
                    multiline
                    style={[
                      styles.field,
                      styles.multilineField,
                      { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
                    ]}
                    value={exerciseForm.instructions.join('\n')}
                    onChangeText={(value) =>
                      setExerciseForm((current) =>
                        current
                          ? {
                              ...current,
                              instructions: value
                                .split('\n')
                                .map((entry) => entry.trim())
                                .filter(Boolean),
                            }
                          : current
                      )
                    }
                  />
                  <TextInput
                    placeholder="Demo videos as Title | URL, one per line"
                    placeholderTextColor={palette.mutedText}
                    multiline
                    style={[
                      styles.field,
                      styles.multilineField,
                      { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
                    ]}
                    value={exerciseForm.demoVideos.map((video) => `${video.title} | ${video.url}`).join('\n')}
                    onChangeText={(value) =>
                      setExerciseForm((current) =>
                        current
                          ? {
                              ...current,
                              demoVideos: value
                                .split('\n')
                                .map((entry) => {
                                  const [title, url] = entry.split('|').map((part) => part.trim());
                                  return { title: title || '', url: url || '' };
                                })
                                .filter((video) => video.title && video.url),
                            }
                          : current
                      )
                    }
                  />
                  <View style={[styles.formRow, styles.formRowActions, !isMedium ? styles.formRowStack : null]}>
                    <Button label="Save changes" onPress={() => void handleSaveExercise()} loading={isSaving} />
                    <Button
                      label="Delete exercise"
                      onPress={() => handleDeleteExercise(selectedExercise)}
                      loading={isSaving}
                      tone="danger"
                    />
                  </View>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: palette.mutedText, fontSize: 14 * fontScale }]}>
                  Select an exercise to review and update it.
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <SectionTitle
        eyebrow="Monitoring"
        title="Community moderation"
        description="Scan recent discussion, remove problematic posts, and clean up comments."
        palette={palette}
        fontScale={fontScale}
      />

      <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {dashboard?.communityPosts.map((post) => (
          <View key={post.id} style={[styles.postCard, { borderColor: palette.border, backgroundColor: palette.background }]}>
            <View style={styles.postHeader}>
              <View style={styles.postCopy}>
                <Text style={[styles.listTitle, { color: palette.text, fontSize: 16 * fontScale }]}>{post.author.name}</Text>
                <Text style={[styles.listMeta, { color: palette.mutedText, fontSize: 12 * fontScale }]}>
                  {post.author.email || 'No email saved'} | {formatDate(post.createdAt)}
                </Text>
              </View>
              <AdminAction label="Delete post" onPress={() => handleDeletePost(post.id)} tone="danger" disabled={isSaving} />
            </View>
            <Text style={[styles.postBody, { color: palette.text, fontSize: 14 * fontScale }]}>{post.content}</Text>
            <Text style={[styles.listMeta, { color: palette.mutedText, fontSize: 12 * fontScale }]}>
              {post.likeCount} likes | {post.commentCount} comments
            </Text>
            {post.comments.map((comment) => (
              <View key={comment.id} style={[styles.commentRow, { borderTopColor: palette.border }]}>
                <View style={styles.commentCopy}>
                  <Text style={[styles.commentAuthor, { color: palette.text, fontSize: 13 * fontScale }]}>
                    {comment.author.name}
                  </Text>
                  <Text style={[styles.commentText, { color: palette.mutedText, fontSize: 13 * fontScale }]}>
                    {comment.content}
                  </Text>
                </View>
                <AdminAction
                  label="Delete"
                  onPress={() => handleDeleteComment(post.id, comment.id)}
                  tone="neutral"
                  disabled={isSaving}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      <SectionTitle
        eyebrow="System"
        title="Logs and API errors"
        description="Recent request history and error traces recorded by the backend telemetry layer."
        palette={palette}
        fontScale={fontScale}
      />

      <View style={[styles.twoColumn, isWide ? styles.twoColumnWide : null]}>
        <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.panelTitle, { color: palette.text, fontSize: 20 * fontScale }]}>Recent logs</Text>
          {(dashboard?.system.requestLogs ?? []).slice(0, 12).map((log) => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: palette.border }]}>
              <Text style={[styles.logCode, { color: palette.text, fontSize: 12 * fontScale }]}>
                {log.method} {log.path}
              </Text>
              <Text style={[styles.listMeta, { color: palette.mutedText, fontSize: 12 * fontScale }]}>
                {log.statusCode} in {log.durationMs}ms | {formatDate(log.timestamp)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.panelTitle, { color: palette.text, fontSize: 20 * fontScale }]}>API errors</Text>
          {(dashboard?.system.apiErrors ?? []).slice(0, 12).map((error) => (
            <View key={error.id} style={[styles.logRow, { borderBottomColor: palette.border }]}>
              <Text style={[styles.logCode, { color: '#b91c1c', fontSize: 12 * fontScale }]}>
                {error.method} {error.path} [{error.statusCode}]
              </Text>
              <Text style={[styles.commentText, { color: palette.text, fontSize: 13 * fontScale }]}>{error.message}</Text>
              <Text style={[styles.listMeta, { color: palette.mutedText, fontSize: 12 * fontScale }]}>
                {formatDate(error.timestamp)}
              </Text>
            </View>
          ))}
          {!dashboard?.system.apiErrors.length ? (
            <Text style={[styles.emptyText, { color: palette.mutedText, fontSize: 14 * fontScale }]}>
              No API errors captured since this backend instance started.
            </Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 26,
    padding: 24,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: {
    fontFamily: Fonts.mono,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    lineHeight: 42,
    maxWidth: 760,
  },
  heroCopy: {
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 760,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
  },
  heroMetaStack: {
    flexDirection: 'column',
  },
  heroMetaCard: {
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    minHeight: 88,
    padding: 16,
  },
  heroMetaLabel: {
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroMetaValue: {
    fontWeight: '700',
  },
  sectionHeading: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionEyebrow: {
    fontFamily: Fonts.mono,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    marginBottom: 6,
  },
  sectionDescription: {
    lineHeight: 22,
    maxWidth: 760,
  },
  statsGrid: {
    gap: 14,
    marginBottom: 28,
  },
  statsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    borderRadius: 26,
    borderWidth: 1,
    flex: 1,
    minHeight: 150,
    minWidth: 220,
    padding: 18,
  },
  statIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 34,
    justifyContent: 'center',
    marginBottom: 16,
    width: 34,
  },
  statLabel: {
    fontWeight: '600',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    marginBottom: 6,
  },
  statNote: {
    lineHeight: 20,
  },
  twoColumn: {
    gap: 16,
    marginBottom: 28,
  },
  twoColumnWide: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    padding: 20,
  },
  panelTitle: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    marginBottom: 16,
  },
  listRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    fontWeight: '700',
  },
  listMeta: {
    lineHeight: 18,
  },
  listActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inlineAction: {
    borderRadius: 12,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseLayout: {
    gap: 14,
  },
  exerciseLayoutWide: {
    flexDirection: 'row',
  },
  exerciseList: {
    gap: 10,
    maxHeight: 560,
  },
  exercisePicker: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  exerciseName: {
    fontWeight: '700',
    marginBottom: 6,
  },
  exerciseMeta: {
    lineHeight: 18,
  },
  editorPane: {
    flex: 1,
    minWidth: 280,
  },
  editorTitle: {
    fontFamily: Fonts.rounded,
    fontWeight: '800',
    marginBottom: 12,
  },
  field: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineField: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowStack: {
    flexDirection: 'column',
  },
  formField: {
    flex: 1,
  },
  formRowActions: {
    marginTop: 4,
  },
  emptyText: {
    lineHeight: 22,
  },
  postCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postCopy: {
    flex: 1,
  },
  postBody: {
    lineHeight: 22,
    marginBottom: 10,
  },
  commentRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
  },
  commentCopy: {
    flex: 1,
    gap: 4,
  },
  commentAuthor: {
    fontWeight: '700',
  },
  commentText: {
    lineHeight: 20,
  },
  logRow: {
    borderBottomWidth: 1,
    gap: 6,
    paddingVertical: 12,
  },
  logCode: {
    fontFamily: Fonts.mono,
    lineHeight: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthorizedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
});
