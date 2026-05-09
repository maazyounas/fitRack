import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
// @ts-ignore
import ConfettiCannon from 'react-native-confetti-cannon';
import { BodyMeasurementChart } from '@/components/progress/BodyMeasurementChart';
import { MilestoneBadge } from '@/components/progress/MilestoneBadge';
import { PerformanceChart } from '@/components/progress/PerformanceChart';
import { WeightChart } from '@/components/progress/WeightChart';
import { StreakFire } from '@/components/progress/StreakFire';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProgressStore } from '@/store/progressStore';
import { BodyMeasurements, GymPerformanceEntry, ProgressPayload, ProgressAchievement } from '@/types/progress';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

const CHART_TYPES = [
  { id: 'weight', label: 'Weight', icon: 'scale' },
  { id: 'body', label: 'Fat/Muscle', icon: 'body' },
  { id: 'strength', label: 'Strength', icon: 'barbell' },
];

const ALL_MILESTONES: Partial<ProgressAchievement>[] = [
  { key: 'first-check-in', title: 'First Check-In', description: 'Logged your first body or gym progress update.' },
  { key: 'streak-bronze', title: 'Bronze Streak', description: '7-day daily check-in streak.' },
  { key: 'streak-silver', title: 'Silver Streak', description: '30-day daily check-in streak.' },
  { key: 'streak-gold', title: 'Gold Streak', description: '100-day daily check-in streak.' },
  { key: 'ton-club', title: 'The Ton Club', description: 'Lifted a cumulative total of 1000kg.' },
  { key: 'titan-lifter', title: 'Titan Lifter', description: 'Lifted a cumulative total of 10,000kg.' },
  { key: 'power-marker', title: 'Power Marker', description: 'Estimated a 100kg+ one-rep max.' },
];

export default function ProgressScreen() {
  const {
    entries,
    streakDays,
    achievements,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    summary,
    plateauMessage,
    isLoading,
    isSaving,
    error,
    initialize,
    addEntry,
    trackStreak
  } = useProgressStore();

  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState<BodyMeasurements>(emptyMeasurements);
  const [performance, setPerformance] = useState<GymPerformanceEntry[]>([emptyPerformance]);
  const [activeChart, setActiveChart] = useState('weight');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const prevAchievementCount = useRef(achievements.length);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (achievements.length > prevAchievementCount.current) {
      setShowConfetti(true);
      prevAchievementCount.current = achievements.length;
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [achievements.length]);

  const fatVsMuscleCopy = useMemo(
    () => `${summary.bodyFatTrend?.toFixed(1) ?? '0.0'}% fat • ${summary.muscleMassTrend?.toFixed(1) ?? '0.0'}kg muscle`,
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
      Alert.alert('Success', 'Progress entry saved!');
    } catch (error) {
      Alert.alert('Progress save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} />}

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Keep showing up to win</Text>
        </View>
        <TouchableOpacity 
          onPress={() => trackStreak()}
          disabled={isLoading}
        >
          <StreakFire streak={streakDays} />
        </TouchableOpacity>
      </View>

      {plateauMessage && (
        <LinearGradient colors={['#fff7ed', '#ffedd5']} style={styles.plateauBox}>
          <Ionicons name="bulb" size={24} color="#ea580c" style={styles.plateauIcon} />
          <View style={styles.plateauContent}>
            <Text style={styles.plateauTitle}>Smart Insight</Text>
            <Text style={styles.plateauText}>{plateauMessage}</Text>
          </View>
        </LinearGradient>
      )}

      <View style={styles.hero}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.metricCard}>
          <Text style={styles.metricLabel}>Weight Change</Text>
          <Text style={styles.metricValue}>
            {summary.weightChangeKg >= 0 ? '+' : ''}{summary.weightChangeKg.toFixed(1)} kg
          </Text>
          <Text style={styles.metricMini}>Last 7 logs</Text>
        </LinearGradient>
        <LinearGradient colors={['#1e1b4b', '#312e81']} style={styles.metricCard}>
          <Text style={styles.metricLabel}>Composition</Text>
          <Text style={styles.metricMiniHigh}>{fatVsMuscleCopy}</Text>
          <Text style={styles.metricMini}>Fat vs Muscle</Text>
        </LinearGradient>
      </View>

      <View style={styles.segmentedContainer}>
        {CHART_TYPES.map(type => (
          <Pressable 
            key={type.id} 
            style={[styles.segment, activeChart === type.id && styles.segmentActive]}
            onPress={() => setActiveChart(type.id)}
          >
            <Ionicons name={type.icon as any} size={18} color={activeChart === type.id ? '#fff' : '#64748b'} />
            <Text style={[styles.segmentText, activeChart === type.id && styles.segmentTextActive]}>{type.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeChart === 'weight' && (
        <>
          <WeightChart title="Daily Weight History" points={dailyTrend} />
          <WeightChart title="30-Day Trend" points={monthlyTrend} />
        </>
      )}
      {activeChart === 'body' && (
        <BodyMeasurementChart title="Body Composition History" points={weeklyTrend} />
      )}
      {activeChart === 'strength' && (
        <PerformanceChart points={monthlyTrend} />
      )}

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Log Today&apos;s Progress</Text>
          <Ionicons name="add-circle" size={24} color="#0f766e" />
        </View>
        
        <Input label="Weight (kg)" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Body Composition</Text>
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Fat %"
                keyboardType="decimal-pad"
                value={String(measurements.bodyFatPercent || '')}
                onChangeText={(value) => updateMeasurement('bodyFatPercent', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Muscle (kg)"
                keyboardType="decimal-pad"
                value={String(measurements.muscleMassKg || '')}
                onChangeText={(value) => updateMeasurement('muscleMassKg', value)}
              />
            </View>
          </View>
        </View>

        <CollapsibleSection title="Body Measurements (cm)">
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input label="Chest" keyboardType="decimal-pad" value={String(measurements.chestCm || '')} onChangeText={(v) => updateMeasurement('chestCm', v)} />
            </View>
            <View style={styles.inlineItem}>
              <Input label="Waist" keyboardType="decimal-pad" value={String(measurements.waistCm || '')} onChangeText={(v) => updateMeasurement('waistCm', v)} />
            </View>
          </View>
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input label="Hips" keyboardType="decimal-pad" value={String(measurements.hipsCm || '')} onChangeText={(v) => updateMeasurement('hipsCm', v)} />
            </View>
            <View style={styles.inlineItem}>
              <Input label="Biceps" keyboardType="decimal-pad" value={String(measurements.bicepsCm || '')} onChangeText={(v) => updateMeasurement('bicepsCm', v)} />
            </View>
          </View>
        </CollapsibleSection>

        <Text style={styles.subheading}>Strength Highlights</Text>
        {performance.map((item, index) => (
          <View key={`perf-${index}`} style={styles.performanceCard}>
            <Input
              label="Exercise Name"
              value={item.exerciseName}
              onChangeText={(value) => updatePerformance(index, 'exerciseName', value)}
            />
            <View style={styles.inline}>
              <View style={[styles.inlineItem, { flex: 2 }]}>
                <Input label="Weight (kg)" keyboardType="decimal-pad" value={String(item.weightKg || '')} onChangeText={(v) => updatePerformance(index, 'weightKg', v)} />
              </View>
              <View style={styles.inlineItem}>
                <Input label="Reps" keyboardType="number-pad" value={String(item.reps || '')} onChangeText={(v) => updatePerformance(index, 'reps', v)} />
              </View>
              <View style={styles.inlineItem}>
                <Input label="Sets" keyboardType="number-pad" value={String(item.sets || '')} onChangeText={(v) => updatePerformance(index, 'sets', v)} />
              </View>
            </View>
          </View>
        ))}
        
        <Pressable
          style={styles.addButton}
          onPress={() => setPerformance((current) => [...current, { ...emptyPerformance }])}
        >
          <Ionicons name="add" size={20} color="#155e75" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </Pressable>
        
        <Button label="Submit Progress Update" onPress={handleSave} loading={isSaving} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Milestone Achievements</Text>
        <Text style={styles.sectionSubtitle}>Unlock badges by staying consistent</Text>
        
        <View style={styles.badgesGrid}>
          {ALL_MILESTONES.map((milestone) => {
            const unlocked = achievements.find(a => a.key === milestone.key);
            return (
              <MilestoneBadge 
                key={milestone.key} 
                achievement={unlocked || milestone as ProgressAchievement} 
                locked={!unlocked}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

function CollapsibleSection({ title, children }: { title: string, children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <View style={styles.collapsible}>
      <Pressable style={styles.collapsibleHeader} onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
      </Pressable>
      {isExpanded && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f8fafc', flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#0f172a', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  plateauBox: { borderRadius: 20, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  plateauIcon: { marginRight: 12 },
  plateauContent: { flex: 1 },
  plateauTitle: { color: '#9a3412', fontSize: 14, fontWeight: '800', marginBottom: 2 },
  plateauText: { color: '#c2410c', fontSize: 13, lineHeight: 18 },
  hero: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metricCard: { borderRadius: 24, flex: 1, padding: 16, minHeight: 120, justifyContent: 'center' },
  metricLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  metricValue: { color: '#fff', fontSize: 26, fontWeight: '900' },
  metricMini: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  metricMiniHigh: { color: '#38bdf8', fontSize: 14, fontWeight: '800' },
  segmentedContainer: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 16, padding: 4, marginBottom: 20 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  segmentActive: { backgroundColor: '#0f172a' },
  segmentText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 28, marginBottom: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { color: '#0f172a', fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { color: '#64748b', fontSize: 14, marginBottom: 20, marginTop: -16 },
  formGroup: { marginTop: 12 },
  formLabel: { color: '#0f172a', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  inline: { flexDirection: 'row', gap: 12 },
  inlineItem: { flex: 1 },
  subheading: { color: '#0f172a', fontSize: 16, fontWeight: '800', marginBottom: 16, marginTop: 24 },
  performanceCard: { backgroundColor: '#f8fafc', borderRadius: 20, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfeff', borderRadius: 16, marginBottom: 24, padding: 16, gap: 8 },
  addButtonText: { color: '#155e75', fontSize: 14, fontWeight: '800' },
  collapsible: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 12 },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  collapsibleTitle: { color: '#64748b', fontSize: 14, fontWeight: '700' },
  collapsibleContent: { paddingBottom: 16 },
  badgesGrid: { marginTop: 8 },
});
