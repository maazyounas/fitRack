import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
import { useAuthStore } from '@/store/authStore';
import { ProgressPayload, ProgressAchievement, BodyMeasurements, GymPerformanceEntry } from '@/types/progress';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader } from '@/components/common/AppHeader';

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
  const { width } = useWindowDimensions();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const {
    streakDays,
    achievements,
    dailyTrend,
    weeklyTrend,
    monthlyTrend,
    summary,
    plateauMessage,
    isLoading,
    isSaving,
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
  const isCompact = width < 380;
  
  const prevAchievementCount = useRef(achievements.length);
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || !user || bootedRef.current) {
      return;
    }

    bootedRef.current = true;
    void initialize();
  }, [initialize, isHydrated, user]);

  useEffect(() => {
    if (achievements.length > prevAchievementCount.current) {
      setShowConfetti(true);
      prevAchievementCount.current = achievements.length;
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [achievements.length]);

  const fatVsMuscleCopy = useMemo(
    () => `${summary.bodyFatTrend?.toFixed(1) ?? '0.0'}% fat â€¢ ${summary.muscleMassTrend?.toFixed(1) ?? '0.0'}kg muscle`,
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
    <View style={styles.page}>
      <AppHeader title="Progress" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, isCompact ? styles.contentCompact : null]}
        showsVerticalScrollIndicator={false}
      >
        {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fadeOut={true} />}

        <View style={[styles.subHeader, isCompact ? styles.subHeaderCompact : null]}>
          <TouchableOpacity
            onPress={() => trackStreak()}
            disabled={isLoading}
            style={isCompact ? styles.streakCompact : null}
          >
            <StreakFire streak={streakDays} fullWidth />
          </TouchableOpacity>
        </View>

      {plateauMessage && (
        <LinearGradient
          colors={['#fff7ed', '#ffedd5']}
          style={[styles.plateauBox, isCompact ? styles.plateauBoxCompact : null]}
        >
          <Ionicons
            name="bulb"
            size={isCompact ? 20 : 24}
            color="#ea580c"
            style={[styles.plateauIcon, isCompact ? styles.plateauIconCompact : null]}
          />
          <View style={styles.plateauContent}>
            <Text style={styles.plateauTitle}>Smart Insight</Text>
            <Text style={[styles.plateauText, isCompact ? styles.plateauTextCompact : null]} numberOfLines={isCompact ? 2 : 3}>
              {plateauMessage}
            </Text>
          </View>
        </LinearGradient>
      )}

      <View style={[styles.hero, isCompact ? styles.heroCompact : null]}>
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
            style={[
              styles.segment,
              isCompact ? styles.segmentCompact : null,
              activeChart === type.id && styles.segmentActive,
            ]}
            onPress={() => setActiveChart(type.id)}
          >
            <Ionicons name={type.icon as any} size={18} color={activeChart === type.id ? '#fff' : '#64748b'} />
            <Text style={[styles.segmentText, activeChart === type.id && styles.segmentTextActive]}>{type.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeChart === 'weight' && (
        <>
          <WeightChart title="Daily Weight History" points={dailyTrend} compact={isCompact} />
          <WeightChart title="30-Day Trend" points={monthlyTrend} compact={isCompact} />
        </>
      )}
      {activeChart === 'body' && (
        <BodyMeasurementChart title="Body Composition History" points={weeklyTrend} compact={isCompact} />
      )}
      {activeChart === 'strength' && (
        <PerformanceChart points={monthlyTrend} compact={isCompact} />
      )}

      <View style={[styles.card, isCompact ? styles.cardCompact : null]}>
        <View style={[styles.sectionHeader, isCompact ? styles.sectionHeaderCompact : null]}>
          <Text style={styles.sectionTitle}>Log Today&apos;s Progress</Text>
          <Ionicons name="add-circle" size={24} color="#0f766e" />
        </View>
        
        <Input label="Weight (kg)" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
        
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Body Composition</Text>
          <View style={[styles.inline, isCompact ? styles.inlineCompact : null]}>
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
          <View key={`perf-${index}`} style={[styles.performanceCard, isCompact ? styles.performanceCardCompact : null]}>
            <Input
              label="Exercise Name"
              value={item.exerciseName}
              onChangeText={(value) => updatePerformance(index, 'exerciseName', value)}
            />
            <View style={[styles.inline, isCompact ? styles.inlineCompact : null]}>
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
          style={[styles.addButton, isCompact ? styles.addButtonCompact : null]}
          onPress={() => setPerformance((current) => [...current, { ...emptyPerformance }])}
        >
          <Ionicons name="add" size={20} color="#155e75" />
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </Pressable>
        
        <Button label="Submit Progress Update" onPress={handleSave} loading={isSaving} />
      </View>

      <View style={[styles.card, isCompact ? styles.cardCompact : null]}>
        <Text style={styles.sectionTitle}>Milestone Achievements</Text>
        <Text style={styles.sectionSubtitle}>Unlock badges by staying consistent</Text>
        
        <View style={[styles.badgesGrid, isCompact ? styles.badgesGridCompact : null]}>
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
    </View>
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
  page: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  screen: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 160,
  },

  contentCompact: {
    padding: 14,
    paddingBottom: 120,
  },

  // ───────────────── Header Area ─────────────────
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  subHeaderCompact: {
    marginBottom: 14,
  },

  streakCompact: {
    alignSelf: 'flex-start',
  },

  subtitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },

  // ───────────────── Plateau Insight ─────────────────
  plateauBox: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    width: '100%',
    alignSelf: 'stretch',

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  plateauIcon: {
    marginRight: 10,
  },

  plateauIconCompact: {
    marginRight: 8,
  },

  plateauContent: {
    flex: 1,
  },

  plateauTitle: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },

  plateauText: {
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  plateauBoxCompact: {
    padding: 10,
    marginBottom: 14,
    borderRadius: 16,
    width: '100%',
  },

  plateauTextCompact: {
    fontSize: 12,
    lineHeight: 16,
  },

  // ───────────────── Hero Cards ─────────────────
  hero: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },

  heroCompact: {
    flexDirection: 'column',
  },

  metricCard: {
    borderRadius: 20,
    flex: 1,
    padding: 12,
    minHeight: 88,
    justifyContent: 'center',
  },

  metricLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  metricValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  metricMini: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '400',
  },

  metricMiniHigh: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },

  // ───────────────── Segmented Control ─────────────────
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },

  segmentCompact: {
    paddingVertical: 8,
    gap: 4,
  },

  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },

  segmentActive: {
    backgroundColor: '#0f172a',
  },

  segmentText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // ───────────────── Main Card ─────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,

    marginBottom: 14,
    padding: 16,

    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  cardCompact: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionHeaderCompact: {
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: -10,
    marginBottom: 14,
  },

  // ───────────────── Form ─────────────────
  formGroup: {
    marginTop: 10,
  },

  formLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },

  inline: {
    flexDirection: 'row',
    gap: 12,
  },

  inlineCompact: {
    flexDirection: 'column',
    gap: 10,
  },

  inlineItem: {
    flex: 1,
  },

  subheading: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 18,
  },

  // ───────────────── Performance ─────────────────
  performanceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },

  performanceCardCompact: {
    padding: 12,
  },

  // ───────────────── Buttons ─────────────────
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#ecfeff',

    borderRadius: 14,

    marginBottom: 20,
    padding: 14,

    gap: 6,
  },

  addButtonCompact: {
    paddingVertical: 12,
  },

  addButtonText: {
    color: '#155e75',
    fontSize: 13,
    fontWeight: '600',
  },

  // ───────────────── Collapsible ─────────────────
  collapsible: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 10,
  },

  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },

  collapsibleTitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },

  collapsibleContent: {
    paddingBottom: 14,
  },

  // ───────────────── Badges ─────────────────
  badgesGrid: {
    marginTop: 10,
  },

  badgesGridCompact: {
    marginTop: 8,
  },
});