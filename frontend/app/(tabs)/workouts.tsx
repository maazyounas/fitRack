import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { useWorkoutStore } from '@/store/workoutStore';
import { AppHeader } from '@/components/common/AppHeader';

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

function getWeekDates(baseIso: string) {
  const baseDate = new Date(baseIso);
  const day = baseDate.getDay();
  const sunday = new Date(baseDate);
  sunday.setDate(baseDate.getDate() - day);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return date;
  });
}

function isSameDay(first: string, second: string) {
  return new Date(first).toDateString() === new Date(second).toDateString();
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const {
    plans,
    templates,
    selectedDate,
    selectedPlanId,
    isLoading,
    initialize,
    setSelectedDate,
    setSelectedPlanId,
    schedulePlan,
    markCompleted,
    applyTemplate,
    refreshAiReview,
    deletePlan,
  } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<'plans' | 'templates'>('plans');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null;
  const scheduledForSelectedDate = useMemo(
    () =>
      plans.flatMap((plan) =>
        plan.schedule
          .filter((entry) => isSameDay(entry.scheduledDate, selectedDate))
          .map((entry) => ({ plan, entry }))
      ),
    [plans, selectedDate]
  );

  const handleSchedule = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a workout', 'Choose a workout plan before scheduling it.');
      return;
    }

    try {
      await schedulePlan(selectedPlan.id, selectedDate);
      Alert.alert('Workout scheduled', 'Your workout was added to the calendar.');
    } catch (error) {
      Alert.alert('Schedule failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleAiReview = async () => {
    if (!selectedPlan) {
      return;
    }

    try {
      const review = await refreshAiReview(selectedPlan.id);
      Alert.alert('AI review ready', `${review.intensityAdjustment}\n\n${review.outdatedReason}`);
    } catch (error) {
      Alert.alert('AI review failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.page}>
      <AppHeader title="Workout Planning" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.subHeader}>
          <Text style={styles.subtitle}>
            Build routines, schedule them weekly, and let AI flag stale plans.
          </Text>
          <Pressable
            onPress={() => router.push('/(modals)/workout-builder' as never)}
            style={styles.addButton}
          >
            <Ionicons color="#fff" name="add" size={24} />
          </Pressable>
        </View>

      <View style={styles.calendarCard}>
        <View style={styles.sectionTopRow}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Button label="Schedule Selected" onPress={handleSchedule} tone="secondary" />
        </View>
        <View style={styles.weekRow}>
          {weekDates.map((date) => {
            const iso = date.toISOString();
            const active = isSameDay(iso, selectedDate);
            return (
              <Pressable
                key={iso}
                onPress={() => setSelectedDate(iso)}
                style={[styles.dayChip, active ? styles.dayChipActive : null]}
              >
                <Text style={[styles.dayChipText, active ? styles.dayChipTextActive : null]}>
                  {formatShortDate(date)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {scheduledForSelectedDate.length ? (
          scheduledForSelectedDate.map(({ plan, entry }) => (
            <View key={`${plan.id}-${entry._id ?? entry.scheduledDate}`} style={styles.scheduleItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleTitle}>{plan.name}</Text>
                <Text style={styles.scheduleMeta}>
                  {entry.status} |{' '}
                  {new Date(entry.scheduledDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {!entry.completed ? (
                <Button
                  label="Complete"
                  onPress={() => void markCompleted(plan.id, entry._id ?? '')}
                  tone="primary"
                />
              ) : (
                <Text style={styles.completeLabel}>Done</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No workouts scheduled for this day yet.</Text>
        )}
      </View>

      {selectedPlan ? (
        <View style={styles.aiCard}>
          <View style={styles.sectionTopRow}>
            <Text style={styles.sectionTitle}>AI Coach Placeholder</Text>
            <Button label="Analyze Plan" onPress={handleAiReview} />
          </View>
          <Text style={styles.aiHeading}>{selectedPlan.name}</Text>
          <Text style={styles.aiCopy}>
            {selectedPlan.aiReview?.intensityAdjustment ??
              'Run AI review to get intensity adjustments, exercise swaps, and outdated-plan detection.'}
          </Text>
          {selectedPlan.aiReview?.exerciseVariations?.map((variation) => (
            <Text key={variation.exerciseName} style={styles.aiVariation}>
              {variation.exerciseName}: {variation.suggestion}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.toggleRow}>
        <Button
          label="My Plans"
          onPress={() => setActiveTab('plans')}
          tone={activeTab === 'plans' ? 'primary' : 'secondary'}
        />
        <Button
          label="Templates"
          onPress={() => setActiveTab('templates')}
          tone={activeTab === 'templates' ? 'primary' : 'secondary'}
        />
      </View>

      {activeTab === 'plans' ? (
        <View>
          {plans.map((plan) => (
            <View key={plan.id}>
              <WorkoutCard
                workout={plan}
                selected={plan.id === selectedPlanId}
                onPress={() => setSelectedPlanId(plan.id)}
              />
              {plan.id === selectedPlanId ? (
                <View style={styles.planActions}>
                  <Button
                    label="Edit"
                    onPress={() =>
                      router.push({
                        pathname: '/(modals)/workout-builder',
                        params: { planId: plan.id },
                      } as never)
                    }
                    tone="secondary"
                  />
                  <Button
                    label="Delete"
                    onPress={() =>
                      Alert.alert('Delete workout', 'This removes the workout plan from your library.', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => void deletePlan(plan.id),
                        },
                      ])
                    }
                    tone="danger"
                  />
                </View>
              ) : null}
            </View>
          ))}
          {!plans.length && !isLoading ? (
            <Text style={styles.emptyText}>No custom plans yet. Create one to begin.</Text>
          ) : null}
        </View>
      ) : (
        <TemplateSelector
          templates={templates}
          onUseTemplate={(template) => {
            void applyTemplate(template.key ?? template.id)
              .then(() =>
                Alert.alert('Template added', `${template.name} is now editable in your plans.`)
              )
              .catch((error) =>
                Alert.alert(
                  'Template failed',
                  error instanceof Error ? error.message : 'Please try again.'
                )
              );
          }}
        />
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f4f7f5',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  subHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 280,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  sectionTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dayChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dayChipActive: {
    backgroundColor: '#0f766e',
  },
  dayChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  dayChipTextActive: {
    color: '#f8fafc',
  },
  scheduleItem: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    borderRadius: 18,
    flexDirection: 'row',
    marginTop: 10,
    padding: 14,
  },
  scheduleTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  scheduleMeta: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  completeLabel: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
  },
  aiCard: {
    backgroundColor: '#ecfccb',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  aiHeading: {
    color: '#365314',
    fontSize: 18,
    fontWeight: '800',
  },
  aiCopy: {
    color: '#4d7c0f',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  aiVariation: {
    color: '#3f6212',
    fontSize: 13,
    marginTop: 8,
  },
  toggleRow: {
    gap: 10,
    marginBottom: 16,
  },
  planActions: {
    gap: 10,
    marginBottom: 16,
    marginTop: -2,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
});

