/**
 * Home Screen — Premium AI-powered dashboard.
 * Upgraded design with animated greeting, fitness score ring,
 * AI insights, quick action cards, and today's plan.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { fetchWeeklyInsights, fetchWorkoutRecommendations } from '../../services/api/ai';
import { AnimatedProgressRing } from '@/components/ui/AnimatedProgressRing';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useNutritionStore } from '@/store/nutritionStore';

const { width } = Dimensions.get('window');

// ─── Quick Actions Config ─────────────────────────────────────────────────────
const getQuickActions = (isAdmin: boolean) => [
  { icon: 'barbell', label: 'Start Workout', route: '/(modals)/workout-builder', gradient: ['#0d9488', '#0f766e'] as const },
  { icon: 'body', label: 'Body Scan', route: '/(modals)/scan', gradient: ['#7c3aed', '#6d28d9'] as const },
  { icon: 'restaurant', label: 'Log Meal', route: '/(modals)/meal-logger', gradient: ['#e11d48', '#be123c'] as const },
  { icon: 'analytics', label: 'Progress', route: '/progress', gradient: ['#2563eb', '#1d4ed8'] as const },
  { icon: 'chatbubbles', label: 'AI Coach', route: '/coach', gradient: ['#d97706', '#b45309'] as const },
  { icon: 'library', label: 'Exercises', route: '/(modals)/exercise-library', gradient: ['#059669', '#047857'] as const },
  ...(isAdmin
    ? [{ icon: Platform.OS === 'web' ? 'shield-checkmark' : 'shield', label: 'Admin Hub', route: '/admin', gradient: ['#475569', '#334155'] as const }]
    : []),
];

// ─── Greeting Helper ──────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Pulse Dot ────────────────────────────────────────────────────────────────
function PulseDot() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 1 / scale.value }));
  return <Animated.View style={[styles.pulseDot, style]} />;
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function QuickActionCard({
  icon, label, route, gradient, delay,
}: {
  icon: string;
  label: string;
  route: string;
  gradient: readonly [string, string, ...string[]];
  delay: number;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={pressStyle}>
      <Pressable
        onPress={() => router.push(route as any)}
        onPressIn={() => { scale.value = withTiming(0.94, { duration: 100 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
        style={styles.quickCard}
      >
        <LinearGradient colors={gradient} style={styles.quickIcon}>
          <Ionicons name={icon as any} size={22} color="#fff" />
        </LinearGradient>
        <Text style={styles.quickLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user, tokens } = useAuthStore();
  const { goals } = useOnboardingStore();
  const { dailyReport, goals: nutritionGoals, initialize: initNutrition } = useNutritionStore();
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    async function loadData() {
      if (!tokens?.accessToken) return;
      setLoading(true);
      try {
        const [insightsRes, recRes] = await Promise.all([
          fetchWeeklyInsights(tokens.accessToken),
          fetchWorkoutRecommendations(tokens.accessToken),
          initNutrition(),
        ]);
        setInsights(insightsRes.insights ?? []);
        setRecommendation(recRes.recommendation ?? null);
      } catch (err) {
        console.error('Failed to load dashboard AI data', err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [tokens?.accessToken]);

  const quickActions = getQuickActions(user?.isAdmin === true);
  const firstName = user?.profile.name?.split(' ')[0] || 'Athlete';
  const avatarUrl = user?.profile.profilePictureUrl;
  
  const calorieGoal = user?.profile.dailyCalories || nutritionGoals.calories || 2000;
  const caloriesConsumed = Math.round(dailyReport.totals.calories || 0);
  const proteinConsumed = Math.round(dailyReport.totals.protein || 0);
  const carbsConsumed = Math.round(dailyReport.totals.carbs || 0);
  const fatsConsumed = Math.round(dailyReport.totals.fats || 0);

  const fitnessScore = 72; // Hardcoded score for now
  const progressPercent = Math.min(100, (caloriesConsumed / calorieGoal) * 100);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.heroName}>{firstName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/notifications' as any)} style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifDot}>
                <PulseDot />
              </View>
            </TouchableOpacity>
            <Pressable onPress={() => router.push('/profile' as any)}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>{firstName.charAt(0)}</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Fitness Score Ring + Stats Row ─────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.ringWrap}>
            <AnimatedProgressRing
              progress={0.72}
              size={100}
              strokeWidth={9}
              useGradient
              trackColor="rgba(255,255,255,0.1)"
              label="72"
              sublabel="score"
              labelColor="#fff"
              duration={1400}
            />
            <Text style={styles.ringLabel}>Fitness Score</Text>
          </View>

          <View style={styles.miniStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{goals.length || user?.fitnessGoals?.workoutFrequencyPerWeek || 0}</Text>
              <Text style={styles.miniStatLabel}>Weekly Goal</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{caloriesConsumed}</Text>
              <Text style={styles.miniStatLabel}>kcal Today</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>3</Text>
              <Text style={styles.miniStatLabel}>Streak 🔥</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── AI Recommendation Banner ─────────────────────────────────────────── */}
      {recommendation?.banner && (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Pressable
            onPress={() => router.push('/coach' as any)}
            style={styles.aiBanner}
          >
            <LinearGradient colors={['rgba(13,148,136,0.12)', 'rgba(13,148,136,0.04)']} style={styles.aiBannerGradient}>
              <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.aiBannerIcon}>
                <Ionicons name="sparkles" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiBannerLabel}>SMART RECOMMENDATION</Text>
                <Text style={styles.aiBannerText}>{recommendation.banner}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#0d9488" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Today's Plan ─────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Today's Plan</Text>
        <Pressable onPress={() => router.push('/(modals)/workout-builder' as any)}>
          <LinearGradient colors={['#0d9488', '#0f766e', '#115e59']} style={styles.todayCard}>
            <View style={styles.todayLeft}>
              <Text style={styles.todayEyebrow}>UPPER BODY</Text>
              <Text style={styles.todayTitle}>Strength Day</Text>
              <View style={styles.todayMeta}>
                <Ionicons name="barbell-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.todayMetaText}>4 exercises</Text>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.todayMetaText}>45 min</Text>
              </View>
            </View>
            <View style={styles.todayRight}>
              <View style={styles.startBtn}>
                <Ionicons name="play" size={20} color="#0f766e" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* ── Calorie Progress ──────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Nutrition</Text>
        <View style={styles.nutritionCard}>
          <View style={styles.nutritionHeader}>
            <View>
              <Text style={styles.nutritionCalVal}>{caloriesConsumed} kcal</Text>
              <Text style={styles.nutritionCalLabel}>of {calorieGoal} goal</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(modals)/meal-logger' as any)}
              style={styles.logMealBtn}
            >
              <Text style={styles.logMealText}>+ Log Meal</Text>
            </Pressable>
          </View>
          <View style={styles.nutritionTrack}>
            <LinearGradient
              colors={['#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.nutritionFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <View style={styles.macroRow}>
            {[
              { label: 'Protein', val: `${proteinConsumed}g`, color: '#0d9488' },
              { label: 'Carbs', val: `${carbsConsumed}g`, color: '#2563eb' },
              { label: 'Fats', val: `${fatsConsumed}g`, color: '#f59e0b' },
            ].map((m) => (
              <View key={m.label} style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                <Text style={styles.macroLabel}>{m.label}</Text>
                <Text style={[styles.macroVal, { color: m.color }]}>{m.val}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ── AI Weekly Insights ────────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>AI Weekly Insights</Text>
          <View style={styles.insightsCard}>
            {insights.map((insight: any, idx: number) => {
              const iconMap: Record<string, string> = { warning: 'alert-circle', celebration: 'trophy', default: 'bulb' };
              const colorMap: Record<string, string> = { warning: '#f59e0b', celebration: '#10b981', default: '#3b82f6' };
              const type = insight.type ?? 'default';
              return (
                <Animated.View key={idx} entering={FadeInRight.delay(idx * 80)} style={styles.insightRow}>
                  <View style={[styles.insightIcon, { backgroundColor: colorMap[type] + '20' }]}>
                    <Ionicons name={iconMap[type] as any} size={16} color={colorMap[type]} />
                  </View>
                  <Text style={styles.insightText}>{insight.text}</Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* ── Quick Actions Grid ────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action, idx) => (
            <QuickActionCard
              key={action.label}
              icon={action.icon}
              label={action.label}
              route={action.route}
              gradient={action.gradient}
              delay={idx * 50}
            />
          ))}
        </View>
      </Animated.View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f7f5' },
  content: { flexGrow: 1, paddingBottom: 32 },

  // Header
  headerGradient: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  greeting: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  heroName: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#0d9488' },
  avatarPlaceholder: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 18, fontWeight: '800' },

  // Stats row
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringWrap: { alignItems: 'center', gap: 6 },
  ringLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '600' },
  miniStats: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  miniStat: { alignItems: 'center', gap: 3 },
  miniStatVal: { color: '#fff', fontSize: 22, fontWeight: '800' },
  miniStatLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  miniDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  // AI Banner
  aiBanner: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  aiBannerGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(13,148,136,0.2)', borderRadius: 16 },
  aiBannerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  aiBannerLabel: { color: '#0d9488', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  aiBannerText: { color: '#0f172a', fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Section
  sectionWrap: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 12 },

  // Today's plan
  todayCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' },
  todayLeft: { flex: 1 },
  todayEyebrow: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  todayTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  todayMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayMetaText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  todayRight: { alignItems: 'center' },
  startBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Nutrition
  nutritionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#0f766e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  nutritionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nutritionCalVal: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  nutritionCalLabel: { color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 2 },
  logMealBtn: { backgroundColor: '#0d9488', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logMealText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  nutritionTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  nutritionFill: { height: '100%', borderRadius: 3 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center', gap: 4 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { color: '#64748b', fontSize: 11 },
  macroVal: { fontSize: 13, fontWeight: '700' },

  // Insights
  insightsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, color: '#334155', fontSize: 13, lineHeight: 18 },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: (width - 52) / 3, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: '#0f172a', fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
