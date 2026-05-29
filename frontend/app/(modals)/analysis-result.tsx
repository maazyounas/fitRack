/**
 * AI Analysis Result Screen — Premium glassmorphism UI.
 * Receives BodyAnalysisResult via route params.
 */

import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedProgressRing } from '@/components/ui/AnimatedProgressRing';
import type { BodyAnalysisResult, BodyType } from '@/types/bodyAnalysis';

const { width } = Dimensions.get('window');

// ─── Body Type Config ─────────────────────────────────────────────────────────
const BODY_TYPE_CONFIG = {
  ectomorph: {
    label: 'Ectomorph',
    emoji: '⚡',
    tagline: 'Lean & Fast Metabolism',
    color: '#2563eb',
    gradient: ['#2563eb', '#1d4ed8'] as const,
    strengths: ['Fast metabolism', 'Natural endurance', 'Low body fat'],
    improvements: ['Build muscle mass', 'Increase caloric intake', 'Compound lifts'],
  },
  mesomorph: {
    label: 'Mesomorph',
    emoji: '🏆',
    tagline: 'Athletic & Versatile',
    color: '#0d9488',
    gradient: ['#0d9488', '#0f766e'] as const,
    strengths: ['Muscle gains easily', 'Balanced physique', 'Athletic baseline'],
    improvements: ['Maintain consistency', 'Cardio variety', 'Flexibility work'],
  },
  endomorph: {
    label: 'Endomorph',
    emoji: '💪',
    tagline: 'Strong & Powerful',
    color: '#7c3aed',
    gradient: ['#7c3aed', '#6d28d9'] as const,
    strengths: ['High strength base', 'Muscle retention', 'Natural power'],
    improvements: ['HIIT conditioning', 'Caloric deficit', 'Cardio frequency'],
  },
} as const;

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const fillW = useSharedValue(0);
  useEffect(() => {
    fillW.value = withDelay(400, withTiming((value / max) * (width - 96), { duration: 1000 }));
  }, [fillW, max, value]);
  const fillStyle = useAnimatedStyle(() => ({ width: fillW.value }));

  return (
    <View style={macroStyles.row}>
      <Text style={macroStyles.label}>{label}</Text>
      <View style={macroStyles.track}>
        <Animated.View style={[macroStyles.fill, { backgroundColor: color }, fillStyle]} />
      </View>
      <Text style={macroStyles.val}>{value}g</Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', width: 64 },
  track: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val: { color: '#fff', fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AnalysisResultScreen() {
  const router = useRouter();
  const { resultJson } = useLocalSearchParams<{ resultJson: string }>();

  const [result, setResult] = useState<BodyAnalysisResult | null>(null);

  useEffect(() => {
    if (resultJson) {
      try {
        setResult(JSON.parse(resultJson));
      } catch {
        Alert.alert('Error', 'Could not load analysis result.');
      }
    }
  }, [resultJson]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#0a0f1e', '#0f172a']} style={StyleSheet.absoluteFill} />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading result…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const config = BODY_TYPE_CONFIG[result.bodyType as keyof typeof BODY_TYPE_CONFIG] ?? BODY_TYPE_CONFIG.mesomorph;
  const confidencePct = Math.round(result.confidence * 100);
  const fitnessScore = Math.round(result.confidence * 82 + 10); // Derived score 10-92

  // Derived macro estimates (placeholder values based on body type)
  const macroMap: Record<BodyType, { protein: number; carbs: number; fat: number }> = {
    ectomorph: { protein: 180, carbs: 320, fat: 70 },
    mesomorph: { protein: 160, carbs: 240, fat: 65 },
    endomorph: { protein: 190, carbs: 150, fat: 60 },
  };
  const macros = macroMap[result.bodyType];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0f172a']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Your Analysis</Text>
        <Pressable onPress={() => router.push('/(modals)/scan' as any)} style={styles.rescanBtn}>
          <Ionicons name="refresh" size={18} color="#2dd4bf" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ──────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient colors={config.gradient} style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroEmoji}>{config.emoji}</Text>
              <Text style={styles.heroEyebrow}>BODY TYPE</Text>
              <Text style={styles.heroType}>{config.label}</Text>
              <Text style={styles.heroTagline}>{config.tagline}</Text>
            </View>
            <View style={styles.heroRight}>
              <AnimatedProgressRing
                progress={result.confidence}
                size={110}
                strokeWidth={10}
                trackColor="rgba(255,255,255,0.2)"
                label={`${confidencePct}%`}
                sublabel="match"
                labelColor="#fff"
                useGradient={false}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Fitness Score ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.scoreRow}>
          <View style={styles.scoreCard}>
            <AnimatedProgressRing
              progress={fitnessScore / 100}
              size={88}
              strokeWidth={8}
              color="#0d9488"
              trackColor="rgba(13,148,136,0.15)"
              label={String(fitnessScore)}
              sublabel="score"
              labelColor="#0d9488"
            />
            <Text style={styles.scoreLabel}>Fitness Score</Text>
          </View>
          <View style={styles.scoreCard}>
            <AnimatedProgressRing
              progress={result.confidence * 0.9}
              size={88}
              strokeWidth={8}
              color="#7c3aed"
              trackColor="rgba(124,58,237,0.15)"
              label={`${Math.round(result.confidence * 90)}%`}
              sublabel="symmetry"
              labelColor="#7c3aed"
            />
            <Text style={styles.scoreLabel}>Symmetry</Text>
          </View>
          <View style={styles.scoreCard}>
            <AnimatedProgressRing
              progress={result.confidence * 0.85 + 0.1}
              size={88}
              strokeWidth={8}
              color="#f59e0b"
              trackColor="rgba(245,158,11,0.15)"
              label={`${Math.round((result.confidence * 0.85 + 0.1) * 100)}%`}
              sublabel="posture"
              labelColor="#f59e0b"
            />
            <Text style={styles.scoreLabel}>Posture</Text>
          </View>
        </Animated.View>

        {/* ── Strengths & Improvements ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.insightRow}>
          {/* Strengths */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={[styles.insightTitle, { color: '#10b981' }]}>Strengths</Text>
            </View>
            {config.strengths.map((s: string) => (
              <View key={s} style={styles.insightItem}>
                <View style={[styles.insightDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.insightText}>{s}</Text>
              </View>
            ))}
          </View>
          {/* Improvements */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="trending-up" size={16} color="#f59e0b" />
              <Text style={[styles.insightTitle, { color: '#f59e0b' }]}>Focus Areas</Text>
            </View>
            {config.improvements.map((s: string) => (
              <View key={s} style={styles.insightItem}>
                <View style={[styles.insightDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.insightText}>{s}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Workout Recommendations ───────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="barbell-outline" size={18} color="#2dd4bf" />
            <Text style={styles.sectionTitle}>Workout Plan</Text>
          </View>
          {result.workoutSuggestions.map((w, i: number) => (
            <View key={i} style={styles.recommendCard}>
              <LinearGradient colors={['rgba(13,148,136,0.15)', 'rgba(13,148,136,0.05)']} style={styles.recommendGradient}>
                <Text style={styles.recommendTitle}>{w.title}</Text>
                <Text style={styles.recommendDesc}>{w.description}</Text>
              </LinearGradient>
            </View>
          ))}
        </Animated.View>

        {/* ── Diet & Macros ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={18} color="#2dd4bf" />
            <Text style={styles.sectionTitle}>Nutrition Guide</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroTitle}>Daily Macro Targets</Text>
            <MacroBar label="Protein" value={macros.protein} max={250} color="#0d9488" />
            <MacroBar label="Carbs" value={macros.carbs} max={400} color="#2563eb" />
            <MacroBar label="Fats" value={macros.fat} max={120} color="#f59e0b" />
            {result.dietSuggestions.map((d, i: number) => (
              <View key={i} style={styles.dietRow}>
                <Ionicons name="leaf-outline" size={14} color="#2dd4bf" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dietTitle}>{d.title}</Text>
                  <Text style={styles.dietDesc}>{d.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── AI Coach Note ─────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.coachCard}>
          <View style={styles.coachIcon}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachTitle}>AI Coach Says</Text>
            <Text style={styles.coachText}>{result.summary}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.actionRow}>
          <Pressable style={styles.secondaryAction} onPress={() => router.replace('/(tabs)/home')}>
            <Ionicons name="home-outline" size={18} color="#2dd4bf" />
            <Text style={styles.secondaryActionText}>Go Home</Text>
          </Pressable>

          <Pressable style={styles.primaryAction} onPress={() => router.push('/(modals)/scan' as any)}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.primaryActionText}>Scan Again</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  rescanBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(45,212,191,0.1)', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  heroCard: { borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroLeft: { flex: 1, gap: 4 },
  heroRight: { alignItems: 'center' },
  heroEmoji: { fontSize: 32, marginBottom: 4 },
  heroEyebrow: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heroType: { color: '#fff', fontSize: 32, fontWeight: '900' },
  heroTagline: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  scoreRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  scoreCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  scoreLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },
  insightRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  insightCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 8 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  insightTitle: { fontSize: 12, fontWeight: '800' },
  insightItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  insightDot: { width: 5, height: 5, borderRadius: 3 },
  insightText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 16, flex: 1 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  recommendCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  recommendGradient: { padding: 16, borderWidth: 1, borderColor: 'rgba(13,148,136,0.2)', borderRadius: 16 },
  recommendTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  recommendDesc: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 },
  macroCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4 },
  macroTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', marginBottom: 12 },
  dietRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  dietTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  dietDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 16 },
  coachCard: { flexDirection: 'row', gap: 14, backgroundColor: 'rgba(13,148,136,0.12)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(13,148,136,0.25)', alignItems: 'flex-start' },
  coachIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' },
  coachTitle: { color: '#2dd4bf', fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  coachText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  secondaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(45,212,191,0.35)', backgroundColor: 'rgba(45,212,191,0.08)' },
  secondaryActionText: { color: '#2dd4bf', fontSize: 13, fontWeight: '800' },
  primaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: '#0d9488' },
  primaryActionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
