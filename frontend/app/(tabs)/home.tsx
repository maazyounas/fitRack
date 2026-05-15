

import { useEffect, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { fetchWorkoutRecommendations } from '../../services/api/ai';
import { AnimatedProgressRing } from '@/components/ui/AnimatedProgressRing';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { AppHeader } from '@/components/common/AppHeader';

const { width } = Dimensions.get('window');

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

// â”€â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function HomeScreen() {
  const router = useRouter();
  const { user, tokens } = useAuthStore();
  const { goals } = useOnboardingStore();
  const { dailyReport, goals: nutritionGoals, initialize: initNutrition } = useNutritionStore();
  const [recommendation, setRecommendation] = useState<any>(null);
  const [, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!tokens?.accessToken) return;
      setLoading(true);
      try {
        const [recRes] = await Promise.all([
          fetchWorkoutRecommendations(tokens.accessToken),
          initNutrition(),
        ]);
        setRecommendation(recRes.recommendation ?? null);
      } catch (err) {
        console.error('Failed to load dashboard AI data', err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [tokens?.accessToken, initNutrition]);

  const isAdmin = Boolean(user?.isAdmin);
  const quickActions = getQuickActions(isAdmin);
  const caloriesConsumed = Math.round(dailyReport.totals.calories || 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader showGreeting />

      <LinearGradient colors={['#0f1c2a', '#1a2b3c']} style={styles.statsGradient}>
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
              <Text style={styles.miniStatLabel}>Streak ðŸ”¥</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

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

      {/* ── Quick Actions Grid ────────────────────────────── */}
      <View style={styles.sectionWrap}>
        <View style={styles.quickGrid}>
          {quickActions.map((action, idx) => (
            <Animated.View key={action.label} entering={FadeInDown.delay(300 + idx * 50).springify()}>
              <Pressable onPress={() => router.push(action.route as any)} style={styles.quickCard}>
                <LinearGradient colors={action.gradient} style={styles.quickIcon}>
                  <Ionicons name={action.icon as any} size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  content: {
    paddingBottom: 40,
  },

  // ───────────────── Stats Section ─────────────────
  statsGradient: {
    marginTop: 10,
    marginHorizontal: 16,

    paddingTop: 22,
    paddingBottom: 24,
    paddingHorizontal: 18,

    borderRadius: 26,

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },

  ringLabel: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ───────────────── Mini Stats ─────────────────
  miniStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  miniStat: {
    alignItems: 'center',
    flex: 1,
  },

  miniStatVal: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  miniStatLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 15,
  },

  miniDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 6,
  },

  // ───────────────── AI Banner ─────────────────
  aiBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 18,

    borderRadius: 18,
    overflow: 'hidden',
  },

  aiBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingVertical: 14,
    paddingHorizontal: 14,

    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.12)',

    backgroundColor: '#ffffff',
  },

  aiBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
  },

  aiBannerLabel: {
    color: '#0d9488',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 4,
  },

  aiBannerText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingRight: 6,
  },

  // ───────────────── Sections ─────────────────
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  // ───────────────── Quick Actions ─────────────────
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  quickCard: {
    width: (width - 52) / 3,

    backgroundColor: '#ffffff',

    borderRadius: 22,

    paddingVertical: 18,
    paddingHorizontal: 10,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 5,

    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.7)',
  },

  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 10,
  },

  quickLabel: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  // ───────────────── Misc ─────────────────
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
  },

  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#0d9488',
  },

  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarLetter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});