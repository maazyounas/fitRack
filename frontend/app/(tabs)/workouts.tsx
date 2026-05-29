import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppHeader } from '@/components/common/AppHeader';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { WorkoutTemplate } from '@/types/workout';
import { Button } from '@/components/ui/Button';
import { useWorkoutStore } from '@/store/workoutStore';
import { useAuthStore } from '@/store/authStore';

export default function WorkoutsScreen() {
  const router = useRouter();
  const { plans, templates, initialize, deletePlan, schedulePlan, applyTemplate } = useWorkoutStore();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerPlanId, setDatePickerPlanId] = useState<string | null>(null);
  const [pickedDate, setPickedDate] = useState<Date>(new Date());
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || !user || bootedRef.current) {
      return;
    }

    bootedRef.current = true;
    void initialize();
  }, [initialize, isHydrated, user]);

  const handleSchedule = (planId: string) => {
    setDatePickerPlanId(planId);
    setPickedDate(new Date());
    setShowDatePicker(true);
  };

  const handleUseTemplate = async (template: WorkoutTemplate) => {
    try {
      const newPlan = await applyTemplate(template.key ?? template.id);
      router.push({ pathname: '/(modals)/workout-builder', params: { planId: newPlan.id } } as never);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to apply template.');
    }
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    Alert.alert('Delete workout?', `Remove "${planName}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deletePlan(planId);
              Alert.alert('Deleted', `"${planName}" was removed successfully.`);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete workout.');
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.page}>
      <AppHeader title="Workouts" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Workouts</Text>
            <Text style={styles.subtitle}>{plans.length} total • Quick create or edit</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(modals)/workout-builder' as never)}
            style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          >
            <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.fabGradient}>
              <Ionicons name="add" size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            templates.length > 0 ? (
              <TemplateSelector templates={templates} onUseTemplate={handleUseTemplate} />
            ) : null
          }
          renderItem={({ item: plan }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{plan.name}</Text>
                  <Text style={styles.cardMeta}>
                    {plan.difficulty} • {plan.exercises?.length || 0} exercises • {plan.estimatedDurationMinutes}min
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(modals)/workout-builder',
                        params: { planId: plan.id },
                      } as never)
                    }
                    style={styles.iconButton}
                  >
                    <Ionicons name="pencil" size={18} color="#0f766e" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeletePlan(plan.id, plan.name)}
                    style={styles.iconButton}
                  >
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              {plan.description && <Text style={styles.cardDesc}>{plan.description}</Text>}

              <View style={styles.cardActions}>
                <Button 
                  label="Start Workout" 
                  onPress={() => router.push({ pathname: '/(modals)/workout-execution', params: { workoutId: plan.id } } as never)} 
                  tone="primary" 
                  stretch 
                />
                <Button label="Schedule" onPress={() => handleSchedule(plan.id)} tone="primary" stretch />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first workout</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      </View>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickedDate}
          minimumDate={new Date()}
          mode="date"
          onChange={async (_, date) => {
            setShowDatePicker(false);
            if (date && datePickerPlanId) {
              setPickedDate(date);
              try {
                await schedulePlan(datePickerPlanId, date.toISOString().split('T')[0]);
                Alert.alert('Scheduled', `Workout scheduled for ${date.toLocaleDateString()}.`);
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to schedule.');
              }
            }
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: 'white', paddingBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={async () => {
                  setShowDatePicker(false);
                  if (datePickerPlanId) {
                    try {
                      await schedulePlan(datePickerPlanId, pickedDate.toISOString().split('T')[0]);
                      Alert.alert('Scheduled', `Workout scheduled for ${pickedDate.toLocaleDateString()}.`);
                    } catch (error) {
                      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to schedule.');
                    }
                  }
                }}>
                  <Text style={{ color: '#0d9488', fontSize: 16, fontWeight: 'bold' }}>Confirm</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pickedDate}
                minimumDate={new Date()}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setPickedDate(date);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f4f7f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardDesc: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  iconButton: {
    padding: 6,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: '#f4f7f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfb',
  },
  difficultyButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  difficultyButtonTextActive: {
    color: '#0d9488',
  },
});

