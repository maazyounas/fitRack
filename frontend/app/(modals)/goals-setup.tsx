import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export default function GoalsSetupModal() {
  const router = useRouter();
  const { updateFitnessGoals, user, isLoading } = useAuthStore();

  const [primaryGoal, setPrimaryGoal] = useState<'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_fitness'>(
    user?.fitnessGoals?.primaryGoal || 'general_fitness'
  );
  const [targetWeightKg, setTargetWeightKg] = useState(
    user?.fitnessGoals?.targetWeightKg ? String(user.fitnessGoals.targetWeightKg) : ''
  );
  const [workoutFrequencyPerWeek, setWorkoutFrequencyPerWeek] = useState(
    user?.fitnessGoals?.workoutFrequencyPerWeek ? String(user.fitnessGoals.workoutFrequencyPerWeek) : '3'
  );

  const handleSave = async () => {
    try {
      await updateFitnessGoals({
        primaryGoal,
        targetWeightKg: targetWeightKg ? Number(targetWeightKg) : undefined,
        workoutFrequencyPerWeek: Number(workoutFrequencyPerWeek),
        setupCompleted: true,
      });
      router.back();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const goalOptions = [
    { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down-outline' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: 'barbell-outline' },
    { id: 'maintenance', label: 'Maintenance', icon: 'body-outline' },
    { id: 'general_fitness', label: 'General Fitness', icon: 'fitness-outline' },
  ] as const;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <LinearGradient
          colors={['#0f766e', '#115e59', '#134e4a']}
          style={styles.hero}
        >
          <View style={styles.iconRing}>
            <Ionicons name="flag" size={32} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Set Your Goals</Text>
          <Text style={styles.heroSub}>
            Let's personalize your FITRACK experience.
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Primary Goal</Text>
          <View style={styles.goalsGrid}>
            {goalOptions.map((opt) => {
              const isActive = primaryGoal === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.goalCard, isActive && styles.goalCardActive]}
                  onPress={() => setPrimaryGoal(opt.id)}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={28}
                    color={isActive ? '#0f766e' : '#64748b'}
                  />
                  <Text style={[styles.goalLabel, isActive && styles.goalLabelActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.sectionTitle}>Target Weight (kg)</Text>
            <Input
              keyboardType="decimal-pad"
              placeholder="e.g. 70"
              value={targetWeightKg}
              onChangeText={setTargetWeightKg}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.sectionTitle}>Workouts Per Week</Text>
            <Text style={styles.freqHint}>How many days will you train?</Text>
            <View style={styles.freqRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                const isActive = Number(workoutFrequencyPerWeek) === num;
                return (
                  <Pressable
                    key={num}
                    style={[styles.freqBtn, isActive && styles.freqBtnActive]}
                    onPress={() => setWorkoutFrequencyPerWeek(String(num))}
                  >
                    <Text style={[styles.freqTxt, isActive && styles.freqTxtActive]}>
                      {num}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <Button label="Save Goals" loading={isLoading} onPress={handleSave} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flexGrow: 1 },
  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  iconRing: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: '#ccfbf1',
    fontSize: 15,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  goalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardActive: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },
  goalLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  goalLabelActive: {
    color: '#0f766e',
  },
  fieldGroup: {
    marginBottom: 24,
  },
  freqHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    marginTop: -8,
  },
  freqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  freqBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqBtnActive: {
    backgroundColor: '#0f766e',
  },
  freqTxt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  freqTxtActive: {
    color: '#fff',
  },
  footer: {
    marginTop: 16,
    paddingBottom: 40,
  },
});
