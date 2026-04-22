import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BodyMeasurementChart } from '@/components/progress/BodyMeasurementChart';
import { MilestoneBadge } from '@/components/progress/MilestoneBadge';
import { PerformanceChart } from '@/components/progress/PerformanceChart';
import { WeightChart } from '@/components/progress/WeightChart';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProgressStore } from '@/store/progressStore';
import { BodyMeasurements, GymPerformanceEntry, ProgressPayload } from '@/types/progress';

const emptyMeasurements: BodyMeasurements = {
  chestCm: 0,
  waistCm: 0,
  hipsCm: 0,
  bicepsCm: 0,
  thighCm: 0,
  bodyFatPercent: 0,
  muscleMassKg: 0,
};

const emptyPerformance: GymPerformanceEntry = {
  exerciseName: '',
  weightKg: 0,
  reps: 0,
  sets: 0,
  oneRepMaxEstimate: 0,
  notes: '',
};

export default function ProgressScreen() {
  const {
    entries,
    streakDays,
    achievements,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    summary,
    isLoading,
    isSaving,
    error,
    initialize,
    addEntry,
  } = useProgressStore();

  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState<BodyMeasurements>(emptyMeasurements);
  const [performance, setPerformance] = useState<GymPerformanceEntry[]>([emptyPerformance]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const latestEntry = entries[0];
  const fatVsMuscleCopy = useMemo(
    () => `${summary.bodyFatTrend.toFixed(1)}% fat • ${summary.muscleMassTrend.toFixed(1)}kg muscle`,
    [summary.bodyFatTrend, summary.muscleMassTrend]
  );

  function updateMeasurement(key: keyof BodyMeasurements, value: string) {
    setMeasurements((current) => ({ ...current, [key]: Number(value) || 0 }));
  }

  function updatePerformance(index: number, key: keyof GymPerformanceEntry, value: string) {
    setPerformance((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (key === 'exerciseName' || key === 'notes') {
          return { ...item, [key]: value };
        }

        return { ...item, [key]: Number(value) || 0 };
      })
    );
  }

  async function handleSave() {
    const validPerformance = performance.filter((item) => item.exerciseName.trim());
    const payload: ProgressPayload = {
      loggedAt: new Date().toISOString(),
      weightKg: Number(weightKg) || 0,
      measurements,
      gymPerformance: validPerformance.map((item) => ({
        exerciseName: item.exerciseName.trim(),
        weightKg: item.weightKg,
        reps: item.reps,
        sets: item.sets,
        notes: item.notes.trim(),
      })),
      notes: notes.trim(),
    };

    try {
      await addEntry(payload);
      setWeightKg('');
      setNotes('');
      setMeasurements(emptyMeasurements);
      setPerformance([emptyPerformance]);
    } catch (error) {
      Alert.alert('Progress save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Progress Tracking</Text>
      <Text style={styles.subtitle}>
        Log body changes, track gym performance, monitor fat and muscle trends, and unlock consistency rewards.
      </Text>

      <View style={styles.hero}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Weight</Text>
          <Text style={styles.metricValue}>{summary.currentWeightKg.toFixed(1)} kg</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weight Change</Text>
          <Text style={styles.metricValue}>{summary.weightChangeKg >= 0 ? '+' : ''}{summary.weightChangeKg.toFixed(1)} kg</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Fat / Muscle</Text>
          <Text style={styles.metricMini}>{fatVsMuscleCopy}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Streak Reward</Text>
          <Text style={styles.metricValue}>{streakDays} days</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f766e" />
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Log Progress</Text>
        <Input label="Weight (kg)" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
        <View style={styles.inline}>
          <View style={styles.inlineItem}>
            <Input
              label="Body Fat %"
              keyboardType="decimal-pad"
              value={String(measurements.bodyFatPercent || '')}
              onChangeText={(value) => updateMeasurement('bodyFatPercent', value)}
            />
          </View>
          <View style={styles.inlineItem}>
            <Input
              label="Muscle Mass (kg)"
              keyboardType="decimal-pad"
              value={String(measurements.muscleMassKg || '')}
              onChangeText={(value) => updateMeasurement('muscleMassKg', value)}
            />
          </View>
        </View>
        <View style={styles.inline}>
          <View style={styles.inlineItem}>
            <Input
              label="Chest (cm)"
              keyboardType="decimal-pad"
              value={String(measurements.chestCm || '')}
              onChangeText={(value) => updateMeasurement('chestCm', value)}
            />
          </View>
          <View style={styles.inlineItem}>
            <Input
              label="Waist (cm)"
              keyboardType="decimal-pad"
              value={String(measurements.waistCm || '')}
              onChangeText={(value) => updateMeasurement('waistCm', value)}
            />
          </View>
        </View>
        <View style={styles.inline}>
          <View style={styles.inlineItem}>
            <Input
              label="Hips (cm)"
              keyboardType="decimal-pad"
              value={String(measurements.hipsCm || '')}
              onChangeText={(value) => updateMeasurement('hipsCm', value)}
            />
          </View>
          <View style={styles.inlineItem}>
            <Input
              label="Biceps (cm)"
              keyboardType="decimal-pad"
              value={String(measurements.bicepsCm || '')}
              onChangeText={(value) => updateMeasurement('bicepsCm', value)}
            />
          </View>
        </View>
        <Input
          label="Thigh (cm)"
          keyboardType="decimal-pad"
          value={String(measurements.thighCm || '')}
          onChangeText={(value) => updateMeasurement('thighCm', value)}
        />

        <Text style={styles.subheading}>Gym Performance</Text>
        {performance.map((item, index) => (
          <View key={`perf-${index}`} style={styles.performanceCard}>
            <Input
              label="Exercise"
              value={item.exerciseName}
              onChangeText={(value) => updatePerformance(index, 'exerciseName', value)}
            />
            <View style={styles.inline}>
              <View style={styles.inlineItem}>
                <Input
                  label="Weight (kg)"
                  keyboardType="decimal-pad"
                  value={String(item.weightKg || '')}
                  onChangeText={(value) => updatePerformance(index, 'weightKg', value)}
                />
              </View>
              <View style={styles.inlineItem}>
                <Input
                  label="Reps"
                  keyboardType="number-pad"
                  value={String(item.reps || '')}
                  onChangeText={(value) => updatePerformance(index, 'reps', value)}
                />
              </View>
              <View style={styles.inlineItem}>
                <Input
                  label="Sets"
                  keyboardType="number-pad"
                  value={String(item.sets || '')}
                  onChangeText={(value) => updatePerformance(index, 'sets', value)}
                />
              </View>
            </View>
            <Input
              label="Notes"
              value={item.notes}
              onChangeText={(value) => updatePerformance(index, 'notes', value)}
            />
          </View>
        ))}
        <Pressable
          style={styles.addButton}
          onPress={() => setPerformance((current) => [...current, { ...emptyPerformance }])}
        >
          <Text style={styles.addButtonText}>Add Exercise Performance</Text>
        </Pressable>
        <Input label="Log notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        <Button label="Save Progress Entry" onPress={handleSave} loading={isSaving} />
      </View>

      <WeightChart title="Daily Weight Graph" points={dailyTrend} />
      <WeightChart title="Weekly Weight Trend" points={weeklyTrend} />
      <BodyMeasurementChart title="Weekly Fat / Muscle Trend" points={weeklyTrend} />
      <PerformanceChart points={monthlyTrend} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Achievement Badges</Text>
        {achievements.length ? (
          achievements.map((achievement) => <MilestoneBadge key={achievement.key} achievement={achievement} />)
        ) : (
          <Text style={styles.emptyText}>No badges yet. Log consistently to unlock streak rewards and milestones.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Check-Ins</Text>
        {entries.slice(0, 5).map((entry) => (
          <View key={entry.id} style={styles.recentEntry}>
            <Text style={styles.recentTitle}>{new Date(entry.loggedAt).toLocaleDateString()}</Text>
            <Text style={styles.recentText}>
              {entry.weightKg.toFixed(1)}kg • Fat {entry.measurements.bodyFatPercent.toFixed(1)}% • Muscle{' '}
              {entry.measurements.muscleMassKg.toFixed(1)}kg
            </Text>
            {entry.gymPerformance.length ? (
              <Text style={styles.recentText}>
                Performance: {entry.gymPerformance.map((item) => `${item.exerciseName} ${item.oneRepMaxEstimate.toFixed(0)}kg`).join(', ')}
              </Text>
            ) : null}
          </View>
        ))}
        {!entries.length ? <Text style={styles.emptyText}>No progress entries yet.</Text> : null}
        {latestEntry?.notes ? <Text style={styles.noteText}>Latest note: {latestEntry.notes}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#eef6f2', flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  hero: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  metricCard: { backgroundColor: '#0f172a', borderRadius: 22, minWidth: '47%', padding: 16 },
  metricLabel: { color: '#67e8f9', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  metricValue: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  metricMini: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  loadingBox: { alignItems: 'center', marginBottom: 14, paddingVertical: 12 },
  errorBox: { backgroundColor: '#fee2e2', borderRadius: 16, marginBottom: 14, padding: 14 },
  errorText: { color: '#991b1b', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, padding: 18 },
  sectionTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  inline: { flexDirection: 'row', gap: 12 },
  inlineItem: { flex: 1 },
  subheading: { color: '#0f172a', fontSize: 15, fontWeight: '800', marginBottom: 10, marginTop: 4 },
  performanceCard: { backgroundColor: '#f8fafc', borderRadius: 18, marginBottom: 12, padding: 14 },
  addButton: { alignItems: 'center', backgroundColor: '#ecfeff', borderRadius: 14, marginBottom: 16, padding: 14 },
  addButtonText: { color: '#155e75', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#64748b', fontSize: 14 },
  recentEntry: { borderBottomColor: '#e2e8f0', borderBottomWidth: 1, paddingVertical: 10 },
  recentTitle: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  recentText: { color: '#475569', fontSize: 13, lineHeight: 18 },
  noteText: { color: '#155e75', fontSize: 13, fontWeight: '700', marginTop: 12 },
});
