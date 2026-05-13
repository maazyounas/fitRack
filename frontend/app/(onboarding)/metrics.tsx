/**
 * Step 2 — User Metrics
 * Height slider, weight picker, age, activity level, experience, optional wrist size.
 */

import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useOnboardingStore, type ActivityLevel, type ExperienceLevel } from '@/store/onboardingStore';
import { PremiumButton } from '@/components/ui/PremiumButton';

const { width } = Dimensions.get('window');
const SLIDER_W = width - 48;

// ─── Slider Component ─────────────────────────────────────────────────────────

function MetricSlider({
  label,
  value,
  min,
  max,
  unit,
  onValueChange,
  step = 1,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onValueChange: (v: number) => void;
  step?: number;
}) {
  const progress = (value - min) / (max - min);
  const thumbLeft = progress * (SLIDER_W - 28);

  const handlePress = (e: any) => {
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / SLIDER_W));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onValueChange(Math.max(min, Math.min(max, stepped)));
  };

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <View style={sliderStyles.valuePill}>
          <Text style={sliderStyles.value}>{value}</Text>
          <Text style={sliderStyles.unit}>{unit}</Text>
        </View>
      </View>

      <View style={sliderStyles.track} onStartShouldSetResponder={() => true} onResponderGrant={handlePress} onResponderMove={handlePress}>
        {/* Filled track */}
        <LinearGradient
          colors={['#0d9488', '#14b8a6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[sliderStyles.fill, { width: `${progress * 100}%` }]}
        />
        {/* Thumb */}
        <View style={[sliderStyles.thumb, { left: thumbLeft }]} />
      </View>

      <View style={sliderStyles.rangeRow}>
        <Text style={sliderStyles.rangeLabel}>{min}{unit}</Text>
        <Text style={sliderStyles.rangeLabel}>{max}{unit}</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  valuePill: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(13,148,136,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, gap: 3 },
  value: { color: '#2dd4bf', fontSize: 22, fontWeight: '800' },
  unit: { color: 'rgba(45,212,191,0.7)', fontSize: 13, fontWeight: '600' },
  track: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative', justifyContent: 'center' },
  fill: { position: 'absolute', height: '100%', borderRadius: 2, left: 0 },
  thumb: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#0d9488', borderWidth: 3, borderColor: '#fff', shadowColor: '#0d9488', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6, top: -12 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rangeLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
});

// ─── Chip Selector ─────────────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={chipStyles.wrap}>
      <Text style={chipStyles.groupLabel}>{label}</Text>
      <View style={chipStyles.row}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[chipStyles.chip, active && chipStyles.chipActive]}
            >
              {opt.icon && (
                <Ionicons
                  name={opt.icon}
                  size={14}
                  color={active ? '#fff' : 'rgba(255,255,255,0.45)'}
                />
              )}
              <Text style={[chipStyles.chipLabel, active && chipStyles.chipLabelActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  groupLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  chipLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600' },
  chipLabelActive: { color: '#fff' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string }[] = [
  { key: 'sedentary', label: 'Sedentary' },
  { key: 'light', label: 'Light' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'active', label: 'Active' },
  { key: 'very_active', label: 'Very Active' },
];

const EXPERIENCE_OPTIONS: { key: ExperienceLevel; label: string }[] = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

export default function MetricsScreen() {
  const router = useRouter();
  const { metrics, setMetrics } = useOnboardingStore();

  const [height, setHeight] = useState(metrics?.heightCm ?? 170);
  const [weight, setWeight] = useState(metrics?.weightKg ?? 70);
  const [age, setAge] = useState(metrics?.age ?? 25);
  const [activity, setActivity] = useState<ActivityLevel | null>(metrics?.activityLevel ?? null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(metrics?.experience ?? null);
  const [wrist, setWrist] = useState(metrics?.wristCm ? String(metrics.wristCm) : '');

  const canContinue = activity !== null && experience !== null;

  const handleContinue = () => {
    setMetrics({
      heightCm: height,
      weightKg: weight,
      age,
      activityLevel: activity!,
      experience: experience!,
      wristCm: wrist ? Number(wrist) : undefined,
    });
    router.push('/(onboarding)/goals');
  };

  const bmi = weight / Math.pow(height / 100, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={StyleSheet.absoluteFill} />

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
        <Text style={styles.progressLabel}>2 of 4</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.eyebrow}>YOUR BODY</Text>
        <Text style={styles.title}>Body Metrics</Text>
        <Text style={styles.subtitle}>
          Accurate measurements unlock precise AI recommendations.
        </Text>

        {/* BMI preview */}
        <View style={styles.bmiCard}>
          <LinearGradient colors={['#0d9488', '#115e59']} style={styles.bmiGradient}>
            <Text style={styles.bmiLabel}>Current BMI</Text>
            <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
            <Text style={styles.bmiCategory}>
              {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
            </Text>
          </LinearGradient>
        </View>

        {/* Sliders */}
        <View style={styles.section}>
          <MetricSlider label="Height" value={height} min={140} max={220} unit="cm" onValueChange={setHeight} />
          <MetricSlider label="Weight" value={weight} min={40} max={150} unit="kg" onValueChange={setWeight} step={0.5} />
          <MetricSlider label="Age" value={age} min={16} max={80} unit="yrs" onValueChange={setAge} />
        </View>

        {/* Chips */}
        <View style={styles.section}>
          <ChipGroup
            label="Activity Level"
            options={ACTIVITY_OPTIONS}
            value={activity}
            onChange={setActivity}
          />
          <ChipGroup
            label="Training Experience"
            options={EXPERIENCE_OPTIONS}
            value={experience}
            onChange={setExperience}
          />
        </View>

        {/* Optional wrist */}
        <View style={styles.section}>
          <Text style={styles.optionalLabel}>Wrist Circumference (optional)</Text>
          <Text style={styles.optionalSub}>
            Improves body frame estimation for ectomorph / endomorph detection.
          </Text>
          <View style={styles.wristInput}>
            <Ionicons name="watch-outline" size={18} color="#2dd4bf" />
            <TextInput
              value={wrist}
              onChangeText={setWrist}
              keyboardType="decimal-pad"
              placeholder="e.g. 17.5"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={styles.wristField}
            />
            <Text style={styles.wristUnit}>cm</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <PremiumButton label="Continue" disabled={!canContinue} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  progressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0d9488', borderRadius: 2 },
  progressLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  eyebrow: { color: '#2dd4bf', fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 8 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 20, marginBottom: 24 },
  bmiCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 28 },
  bmiGradient: { padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bmiLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  bmiValue: { color: '#fff', fontSize: 36, fontWeight: '800' },
  bmiCategory: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  section: { marginBottom: 8 },
  optionalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  optionalSub: { color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  wristInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  wristField: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  wristUnit: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
});
