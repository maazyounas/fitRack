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
          <LinearGradient colors={selected ? goal.gradient : ['#f1f5f9', '#f8fafc']} style={styles.iconBg}>
            <Ionicons name={goal.icon} size={24} color={selected ? '#fff' : '#64748b'} />
          </LinearGradient>
          <Text style={[styles.cardLabel, selected && { color: '#0d9488' }]}>{goal.label}</Text>
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
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '75%' }]} /></View>
            <Text style={styles.progressLabel}>Step 3 of 4</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR MISSION</Text>
            <Text style={styles.title}>Fitness Goals</Text>
            <Text style={styles.subtitle}>Pick as many as you like — we'll build a personalised plan around all of them.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {selected.size > 0 && (
            <View style={styles.countPill}>
              <Ionicons name="checkmark-circle" size={16} color="#0d9488" />
              <Text style={styles.countText}>{selected.size} goal{selected.size > 1 ? 's' : ''} selected</Text>
            </View>
          )}
          
          <View style={styles.grid}>
            {GOALS.map((goal) => (
              <GoalCard key={goal.key} goal={goal} selected={selected.has(goal.key)} onToggle={() => toggle(goal.key)} />
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <PremiumButton label="Continue" disabled={selected.size === 0} onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: { marginTop: 20 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 10 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, maxWidth: '90%' },
  card: { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 20, marginTop: -40, padding: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  scrollContent: { paddingTop: 0 },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdfa', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ccfbf1' },
  countText: { color: '#0d9488', fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  glowBorder: { borderRadius: 22, padding: 2 },
  cardInner: { backgroundColor: '#f8fafc', borderRadius: 21, borderWidth: 1.5, borderColor: '#e2e8f0', padding: 16, alignItems: 'center', gap: 10, minHeight: 145, justifyContent: 'center' },
  cardSelected: { backgroundColor: '#f0fdfa', borderColor: '#0d9488' },
  iconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { color: '#475569', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  cardDesc: { color: '#94a3b8', fontSize: 11, textAlign: 'center', lineHeight: 14 },
  checkMark: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, backgroundColor: '#f1f5f9' },
});
