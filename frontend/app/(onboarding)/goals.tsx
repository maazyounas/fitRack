/**
 * Step 3 — Fitness Goals Selection
 * Multi-select 2-column grid with animated cards.
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
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useOnboardingStore, type OnboardingGoal } from '@/store/onboardingStore';
import { PremiumButton } from '@/components/ui/PremiumButton';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 12) / 2;

type GoalOption = {
  key: OnboardingGoal;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
  gradient: readonly [string, string, ...string[]];
};

const GOALS: GoalOption[] = [
  { key: 'build_muscle', label: 'Build Muscle', icon: 'barbell-outline', description: 'Hypertrophy & size', gradient: ['#0d9488', '#0f766e'] },
  { key: 'gain_strength', label: 'Gain Strength', icon: 'flash-outline', description: 'Powerlifting focus', gradient: ['#7c3aed', '#6d28d9'] },
  { key: 'lose_weight', label: 'Lose Weight', icon: 'flame-outline', description: 'Fat loss & toning', gradient: ['#e11d48', '#be123c'] },
  { key: 'conditioning', label: 'Conditioning', icon: 'pulse-outline', description: 'Endurance & cardio', gradient: ['#2563eb', '#1d4ed8'] },
  { key: 'fundamentals', label: 'Fundamentals', icon: 'school-outline', description: 'Master the basics', gradient: ['#f59e0b', '#d97706'] },
  { key: 'sports_performance', label: 'Sports Perf.', icon: 'trophy-outline', description: 'Athletic training', gradient: ['#10b981', '#059669'] },
];

function GoalCard({ goal, selected, onToggle }: { goal: GoalOption; selected: boolean; onToggle: () => void }) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={() => {
      scale.value = withSpring(0.94, { damping: 10 }, () => { scale.value = withSpring(1); });
      onToggle();
    }}>
      <Animated.View style={[{ width: CARD_W }, cardStyle]}>
        {selected && (
          <LinearGradient colors={goal.gradient} style={[StyleSheet.absoluteFill, styles.glowBorder]} />
        )}
        <View style={[styles.cardInner, selected && styles.cardSelected]}>
          <LinearGradient colors={selected ? goal.gradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']} style={styles.iconBg}>
            <Ionicons name={goal.icon} size={26} color={selected ? '#fff' : 'rgba(255,255,255,0.4)'} />
          </LinearGradient>
          <Text style={[styles.cardLabel, selected && { color: '#fff' }]}>{goal.label}</Text>
          <Text style={styles.cardDesc}>{goal.description}</Text>
          {selected && (
            <View style={styles.checkMark}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const { goals: storedGoals, setGoals } = useOnboardingStore();
  const [selected, setSelected] = useState<Set<OnboardingGoal>>(new Set(storedGoals));

  const toggle = (key: OnboardingGoal) => {
    setSelected((prev: Set<OnboardingGoal>) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleContinue = () => {
    setGoals(Array.from(selected));
    router.push('/(onboarding)/ai-intro');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={StyleSheet.absoluteFill} />
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '75%' }]} /></View>
        <Text style={styles.progressLabel}>3 of 4</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR MISSION</Text>
        <Text style={styles.title}>What are your{'\n'}fitness goals?</Text>
        <Text style={styles.subtitle}>Pick as many as you like — we'll build a personalised plan around all of them.</Text>
        {selected.size > 0 && (
          <View style={styles.countPill}>
            <Ionicons name="checkmark-circle" size={16} color="#2dd4bf" />
            <Text style={styles.countText}>{selected.size} goal{selected.size > 1 ? 's' : ''} selected</Text>
          </View>
        )}
        <View style={styles.grid}>
          {GOALS.map((goal) => (
            <GoalCard key={goal.key} goal={goal} selected={selected.has(goal.key)} onToggle={() => toggle(goal.key)} />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PremiumButton label="Continue" disabled={selected.size === 0} onPress={handleContinue} />
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
  title: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(45,212,191,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 20, alignSelf: 'flex-start' },
  countText: { color: '#2dd4bf', fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  glowBorder: { borderRadius: 22, padding: 1.5 },
  cardInner: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18, alignItems: 'center', gap: 10, minHeight: 155 },
  cardSelected: { backgroundColor: 'rgba(13,148,136,0.1)', borderColor: 'transparent' },
  iconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  cardDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center' },
  checkMark: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12 },
});
