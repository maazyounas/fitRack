/**
 * Step 2 — User Metrics
 * Height slider, weight picker, age, activity level, experience, optional wrist size.
 */

import { useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore, type ActivityLevel, type BodyType, type ExperienceLevel } from '@/store/onboardingStore';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Layout, Radius, Shadows, Typography } from '@/constants/designSystem';

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

  const clampValue = (nextValue: number) => Math.max(min, Math.min(max, nextValue));
  const increment = () => onValueChange(clampValue(Number((value + step).toFixed(2))));
  const decrement = () => onValueChange(clampValue(Number((value - step).toFixed(2))));

  const handlePress = (e: any) => {
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / SLIDER_W));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onValueChange(clampValue(Number(stepped.toFixed(2))));
  };

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.label}>{label}</Text>
        <View style={sliderStyles.valueControl}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label}`}
            onPress={decrement}
            style={({ pressed }) => [sliderStyles.adjustButton, pressed && sliderStyles.adjustButtonPressed]}
          >
            <Text style={sliderStyles.adjustButtonText}>-</Text>
          </Pressable>
          <View style={sliderStyles.valuePill}>
            <Text style={sliderStyles.value}>{value}</Text>
            <Text style={sliderStyles.unit}>{unit}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label}`}
            onPress={increment}
            style={({ pressed }) => [sliderStyles.adjustButton, pressed && sliderStyles.adjustButtonPressed]}
          >
            <Text style={sliderStyles.adjustButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={sliderStyles.track} onStartShouldSetResponder={() => true} onResponderGrant={handlePress} onResponderMove={handlePress}>
        <View style={sliderStyles.trackBg} />
        <LinearGradient
          colors={['#0d9488', '#14b8a6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[sliderStyles.fill, { width: `${progress * 100}%` }]}
        />
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
  wrap: { marginBottom: Layout.sectionGap },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  label: { color: '#334155', ...Typography.label },
  valueControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjustButton: { width: 30, height: 30, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6fffb', borderWidth: 1, borderColor: '#99f6e4' },
  adjustButtonPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  adjustButtonText: { color: '#0d9488', fontSize: 18, fontWeight: '800', lineHeight: 18, marginTop: -1 },
  valuePill: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#f0fdfa', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, gap: 3, borderWidth: 1, borderColor: '#ccfbf1' },
  value: { color: '#0d9488', fontSize: 20, fontWeight: '800' },
  unit: { color: '#0d9488', fontSize: 12, fontWeight: '600', opacity: 0.7 },
  track: { height: 32, position: 'relative', justifyContent: 'center' },
  trackBg: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, width: '100%' },
  fill: { position: 'absolute', height: 6, borderRadius: 3, left: 0 },
  thumb: { position: 'absolute', width: 28, height: 28, borderRadius: Radius.full, backgroundColor: '#fff', borderWidth: 2, borderColor: '#0d9488', ...Shadows.sm },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rangeLabel: { color: '#94a3b8', ...Typography.caption },
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
                  color={active ? '#fff' : '#64748b'}
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
  wrap: { marginBottom: Layout.sectionGap },
  groupLabel: { color: '#334155', ...Typography.label, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: '#0d9488', borderColor: '#0d9488' },
  chipLabel: { color: '#64748b', ...Typography.label },
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

function getBodyType({
  height,
  weight,
  wrist,
}: {
  height: number;
  weight: number;
  wrist?: number;
}): BodyType {
  const bmi = weight / Math.pow(height / 100, 2);
  if (wrist !== undefined && wrist < 15.5) return 'ectomorph';
  if (bmi < 20 || (wrist !== undefined && wrist < 17)) return 'ectomorph';
  if (bmi >= 27 || (wrist !== undefined && wrist >= 19)) return 'endomorph';
  return 'mesomorph';
}

export default function MetricsScreen() {
  const router = useRouter();
  const { metrics, setMetrics, setBodyType } = useOnboardingStore();

  const [height, setHeight] = useState(metrics?.heightCm ?? 170);
  const [weight, setWeight] = useState(metrics?.weightKg ?? 70);
  const [age, setAge] = useState(metrics?.age ?? 25);
  const [activity, setActivity] = useState<ActivityLevel | null>(metrics?.activityLevel ?? null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(metrics?.experience ?? null);
  const [wrist, setWrist] = useState(metrics?.wristCm ? String(metrics.wristCm) : '');

  const canContinue = activity !== null && experience !== null;
  const bodyType = getBodyType({
    height,
    weight,
    wrist: wrist ? Number(wrist) : undefined,
  });

  const handleContinue = () => {
    setMetrics({
      heightCm: height,
      weightKg: weight,
      age,
      activityLevel: activity!,
      experience: experience!,
      wristCm: wrist ? Number(wrist) : undefined,
    });
    setBodyType(bodyType);
    router.push('/(onboarding)/goals');
  };

  const bmi = weight / Math.pow(height / 100, 2);

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Hero Banner */}
      <LinearGradient
        colors={['#0d9488', '#0f766e', '#115e59']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
            <Text style={styles.progressLabel}>Step 2 of 4</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR BASELINE</Text>
            <Text style={styles.title}>Body Metrics</Text>
            <Text style={styles.subtitle}>
              A few quick measurements help us personalize your plan with more accuracy.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card */}
        <View style={styles.card}>
          {/* BMI preview */}
          <View style={styles.bmiSection}>
            <View style={styles.bmiHeader}>
              <Text style={styles.bmiLabel}>Estimated BMI</Text>
              <View style={styles.bmiBadge}>
                <Text style={styles.bmiBadgeText}>
                  {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
                </Text>
              </View>
            </View>
            <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Sliders */}
          <MetricSlider label="Height" value={height} min={140} max={220} unit="cm" onValueChange={setHeight} />
          <MetricSlider label="Weight" value={weight} min={40} max={150} unit="kg" onValueChange={setWeight} step={0.5} />
          <MetricSlider label="Age" value={age} min={16} max={80} unit="yrs" onValueChange={setAge} />

          <View style={styles.divider} />

          {/* Chips */}
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

          <View style={styles.divider} />

          {/* Optional wrist */}
          <View style={styles.wristSection}>
            <Text style={styles.optionalLabel}>Wrist Circumference (optional)</Text>
            <Text style={styles.optionalSub}>
              Helps us estimate your frame size for a better body-type match.
            </Text>
            <View style={styles.wristInput}>
              <Ionicons name="watch-outline" size={18} color="#0d9488" />
              <TextInput
                value={wrist}
                onChangeText={setWrist}
                keyboardType="decimal-pad"
                placeholder="e.g. 17.5"
                placeholderTextColor="#94a3b8"
                style={styles.wristField}
              />
              <Text style={styles.wristUnit}>cm</Text>
            </View>
          </View>
        </View>

        {/* Extra padding for footer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <PremiumButton label="Continue" disabled={!canContinue} onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: Layout.screenPaddingWide,
    borderBottomLeftRadius: Radius.xxxl,
    borderBottomRightRadius: Radius.xxxl,
  },
  heroContent: { marginTop: 20 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  title: { color: '#fff', ...Typography.h1, marginBottom: 10 },
  subtitle: { color: 'rgba(255,255,255,0.8)', ...Typography.body, maxWidth: '90%' },
  card: { backgroundColor: '#fff', borderRadius: Radius.xxl, marginHorizontal: Layout.screenPadding, marginTop: -40, padding: 24, ...Shadows.lg },
  scrollContent: { paddingTop: 0 },
  bmiSection: { marginBottom: 20 },
  bmiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bmiLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  bmiBadge: { backgroundColor: '#f0fdfa', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  bmiBadgeText: { color: '#0d9488', fontSize: 11, fontWeight: '700' },
  bmiValue: { color: '#1e293b', fontSize: 36, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: Layout.sectionGap },
  wristSection: { marginBottom: 8 },
  optionalLabel: { color: '#334155', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  optionalSub: { color: '#64748b', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  wristInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1.5, borderColor: '#e2e8f0' },
  wristField: { flex: 1, color: '#1e293b', fontSize: 16, fontWeight: '600' },
  wristUnit: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Layout.screenPaddingWide, paddingBottom: 40, paddingTop: 16, backgroundColor: '#f1f5f9' },
});
