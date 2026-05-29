import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fetchAiCoachSummary, sendAiCoachMessage } from '@/services/api/ai';
import { buildAiCoachDataPoints, generateAiCoachChat, generateAiCoachSummary } from '@/services/ai/coach';
import { useAuthStore } from '@/store/authStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useProgressStore } from '@/store/progressStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { AiCoachMessage, AiCoachSummary } from '@/types/ai';

function createMessage(role: AiCoachMessage['role'], text: string, followUps?: string[]): AiCoachMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    followUps,
  };
}

export default function CoachScreen() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.tokens?.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const workoutPlans = useWorkoutStore((state) => state.plans);
  const nutritionDailyReport = useNutritionStore((state) => state.dailyReport);
  const nutritionGoals = useNutritionStore((state) => state.goals);
  const progressSummary = useProgressStore((state) => state.summary);
  const progressStreakDays = useProgressStore((state) => state.streakDays);
  const progressEntries = useProgressStore((state) => state.entries);
  const progressMonthlyTrend = useProgressStore((state) => state.monthlyTrend);

  const [summary, setSummary] = useState<AiCoachSummary | null>(null);
  const [messages, setMessages] = useState<AiCoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bootedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const dataPoints = useMemo(
    () =>
      buildAiCoachDataPoints({
        user,
        workouts: workoutPlans,
        nutritionReport: nutritionDailyReport,
        nutritionGoals,
        progressSummary,
        streakDays: progressStreakDays,
        progressEntries,
        monthlyTrend: progressMonthlyTrend,
      }),
    [
      nutritionDailyReport,
      nutritionGoals,
      progressEntries,
      progressMonthlyTrend,
      progressStreakDays,
      progressSummary,
      user,
      workoutPlans,
    ]
  );

  const refreshCoach = useCallback(async (showErrors = false) => {
    const applyLocalSummary = () => {
      const localSummary = generateAiCoachSummary(
        buildAiCoachDataPoints({
          user: useAuthStore.getState().user,
          workouts: useWorkoutStore.getState().plans,
          nutritionReport: useNutritionStore.getState().dailyReport,
          nutritionGoals: useNutritionStore.getState().goals,
          progressSummary: useProgressStore.getState().summary,
          streakDays: useProgressStore.getState().streakDays,
          progressEntries: useProgressStore.getState().entries,
          monthlyTrend: useProgressStore.getState().monthlyTrend,
        })
      );

      setSummary(localSummary);
      setMessages([
        createMessage(
          'coach',
          `Recovery is ${localSummary.recovery.recoveryScore}/100 and stress is ${localSummary.stress.level}. I'm using your latest workout, nutrition, and progress data to coach you.`,
          ['Should I take a recovery day?', 'How hard should I train today?', 'What should I eat today?']
        ),
      ]);
    };

    try {
      if (accessToken) {
        await Promise.allSettled([
          useWorkoutStore.getState().initialize(),
          useNutritionStore.getState().initialize(),
          useProgressStore.getState().initialize(),
        ]);
      }

      if (!accessToken) {
        applyLocalSummary();
        return;
      }

      try {
        const response = await fetchAiCoachSummary(accessToken);
        setSummary(response.summary);
        setMessages([
          createMessage(
            'coach',
            `Recovery is ${response.summary.recovery.recoveryScore}/100 and stress is ${response.summary.stress.level}. Ask about training, meals, soreness, or recovery days.`,
            ['Should I take a recovery day?', 'How do I reduce stress?', 'Plan my training today']
          ),
        ]);
      } catch {
        applyLocalSummary();
      }
    } catch (error) {
      applyLocalSummary();
      if (showErrors) {
        Alert.alert('Coach refresh failed', error instanceof Error ? error.message : 'Please try again.');
      }
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isHydrated || bootedRef.current) {
      return;
    }

    bootedRef.current = true;

    async function load() {
      setIsBooting(true);
      await refreshCoach();
      setIsBooting(false);
    }

    void load();
  }, [isHydrated, refreshCoach]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timer);
  }, [messages.length]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await refreshCoach(true);
    setIsRefreshing(false);
  }

  async function handleSend(seedMessage?: string) {
    const nextMessage = (seedMessage ?? input).trim();
    if (!nextMessage) {
      return;
    }

    const fallbackSummary = summary ?? generateAiCoachSummary(dataPoints);
    const optimisticCoachMessage = createMessage(
      'coach',
      generateAiCoachChat(nextMessage, dataPoints, fallbackSummary).reply,
      generateAiCoachChat(nextMessage, dataPoints, fallbackSummary).followUps
    );

    setMessages((current) => [...current, createMessage('user', nextMessage), optimisticCoachMessage]);
    setInput('');

    try {
      setIsSending(true);

      const response = tokens?.accessToken
        ? await sendAiCoachMessage(tokens.accessToken, nextMessage).catch(() => null)
        : null;

      if (response?.reply) {
        setMessages((current) =>
          current.map((message) =>
            message.id === optimisticCoachMessage.id
              ? createMessage('coach', response.reply, response.followUps)
              : message
          )
        );
      }
    } catch (error) {
      Alert.alert('Message failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  const promptChips = [
    { label: 'Workout ideas?', icon: 'barbell-outline' },
    { label: 'How is my recovery?', icon: 'heart-outline' },
    { label: 'Why no progress?', icon: 'trending-down-outline' },
    { label: 'Healthy meal ideas', icon: 'nutrition-outline' },
  ];

  const resolvedSummary = summary ?? generateAiCoachSummary(dataPoints);
  const adherence =
    dataPoints.recentWorkouts.length > 0
      ? Math.round(
          dataPoints.recentWorkouts.reduce((sum, workout) => sum + workout.completionRate, 0) /
            dataPoints.recentWorkouts.length
        )
      : 0;
  const hydrationGap = Math.max(0, dataPoints.nutrition.waterGoal - dataPoints.nutrition.waterMl);
  const proteinProgress = Math.round(
    dataPoints.nutrition.proteinGoal > 0
      ? (dataPoints.nutrition.protein / dataPoints.nutrition.proteinGoal) * 100
      : 0
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void handleRefresh()} />}
    >
      <LinearGradient colors={['#0f172a', '#155e75', '#14b8a6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color="#0f172a" />
            <Text style={styles.heroBadgeText}>AI Coaching Module</Text>
          </View>
          <Text style={styles.heroHint}>Live analysis</Text>
        </View>
        <Text style={styles.heroTitle}>Train smarter with recovery and stress-aware coaching.</Text>
        <Text style={styles.heroSubtitle}>
          Personalized analysis of your workouts, nutrition, and progress with a chat-based AI trainer.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>Recovery</Text>
            <Text style={styles.heroStatValue}>{resolvedSummary.recovery.recoveryScore}</Text>
            <Text style={styles.heroStatHint}>
              {resolvedSummary.recovery.recommendRecoveryDay ? 'Recovery day suggested' : 'Ready for controlled work'}
            </Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>Stress</Text>
            <Text style={[styles.heroStatValue, styles.capitalize]}>{resolvedSummary.stress.level}</Text>
            <Text style={styles.heroStatHint}>Score {resolvedSummary.stress.stressScore}/100</Text>
          </View>
        </View>
      </LinearGradient>

      {isBooting ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f766e" />
          <Text style={styles.loadingText}>Reviewing your latest fitness data...</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Workout Adherence</Text>
          <Text style={styles.metricValue}>{adherence ? `${adherence}%` : 'No data'}</Text>
          <Text style={styles.metricHint}>Based on your latest training plans</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Hydration Gap</Text>
          <Text style={styles.metricValue}>{hydrationGap} mL</Text>
          <Text style={styles.metricHint}>Remaining to hit today&apos;s water target</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Protein Progress</Text>
          <Text style={styles.metricValue}>{proteinProgress}%</Text>
          <Text style={styles.metricHint}>Coverage against your daily goal</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Training Streak</Text>
          <Text style={styles.metricValue}>{dataPoints.progress.streakDays} days</Text>
          <Text style={styles.metricHint}>Useful for balancing momentum and fatigue</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Coach Insights</Text>
        {resolvedSummary.insights.map((insight) => (
          <View key={insight} style={styles.listRow}>
            <Ionicons name="analytics" size={16} color="#0f766e" />
            <Text style={styles.listText}>{insight}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recovery Recommendations</Text>
        {resolvedSummary.recovery.suggestions.map((suggestion) => (
          <View key={suggestion} style={styles.listRow}>
            <Ionicons name="leaf" size={16} color="#0f766e" />
            <Text style={styles.listText}>{suggestion}</Text>
          </View>
        ))}
        <View style={styles.chipRow}>
          {resolvedSummary.suggestedRecoveryDays.map((day) => (
            <View key={day} style={styles.chip}>
              <Text style={styles.chipText}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Stress Detection</Text>
        {resolvedSummary.stress.markers.map((marker) => (
          <View key={marker} style={styles.listRow}>
            <Ionicons name="pulse" size={16} color="#f97316" />
            <Text style={styles.listText}>{marker}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.chatHeader}>
          <View>
            <Text style={styles.sectionTitle}>Chat-Based AI Trainer</Text>
            <Text style={styles.chatSubtitle}>Ask fitness, recovery, nutrition, or stress questions.</Text>
          </View>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>AI API + fallback</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptRow}>
          {promptChips.map((chip) => (
            <Pressable key={chip.label} onPress={() => void handleSend(chip.label)} style={styles.promptChip}>
              <Ionicons name={chip.icon as any} size={14} color="#0f766e" />
              <Text style={styles.promptChipText}>{chip.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageCard, message.role === 'coach' ? styles.coachMessage : styles.userMessage]}
          >
            <Text style={[styles.messageRole, message.role === 'coach' ? styles.coachRole : styles.userRole]}>
              {message.role === 'coach' ? 'Coach' : 'You'}
            </Text>
            <Text style={[styles.messageText, message.role === 'coach' ? styles.coachText : styles.userText]}>
              {message.text}
            </Text>
            {message.followUps?.length ? (
              <View style={styles.chipRow}>
                {message.followUps.map((item) => (
                  <Pressable key={item} onPress={() => void handleSend(item)} style={styles.followUpChip}>
                    <Text style={styles.followUpText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {isSending && (
          <View style={[styles.messageCard, styles.coachMessage, styles.typingBubble]}>
            <ActivityIndicator size="small" color="#0f766e" />
            <Text style={styles.typingText}>Coach is thinking...</Text>
          </View>
        )}

        <Input
          label="Ask your AI trainer"
          value={input}
          onChangeText={setInput}
          placeholder="Should I lift heavy or recover today?"
          multiline
          numberOfLines={3}
        />
        <Button label="Send Message" onPress={() => void handleSend()} loading={isSending} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f3f7f6',
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    borderRadius: 28,
    marginBottom: 18,
    padding: 20,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroBadgeText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroHint: {
    color: '#ccfbf1',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#dbeafe',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  heroStatLabel: {
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroStatValue: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroStatHint: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  loadingBox: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#475569',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    minHeight: 126,
    padding: 16,
    width: '48%',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  metricHint: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  listRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  listText: {
    color: '#334155',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#115e59',
    fontSize: 12,
    fontWeight: '700',
  },
  chatHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatSubtitle: {
    color: '#64748b',
    fontSize: 13,
  },
  headerPill: {
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerPillText: {
    color: '#155e75',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  messageCard: {
    borderRadius: 20,
    marginBottom: 12,
    padding: 14,
  },
  coachMessage: {
    backgroundColor: '#f0fdfa',
  },
  userMessage: {
    backgroundColor: '#0f766e',
  },
  messageRole: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  coachRole: {
    color: '#0f766e',
  },
  userRole: {
    color: '#99f6e4',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  coachText: {
    color: '#0f172a',
  },
  userText: {
    color: '#ecfeff',
  },
  followUpChip: {
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  followUpText: {
    color: '#115e59',
    fontSize: 12,
    fontWeight: '700',
  },
  promptRow: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  promptChip: {
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    borderColor: '#ccfbf1',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  promptChipText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  typingText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
});

