import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalorieProgress } from '../../components/nutrition/CalorieProgress';
import { MealCard } from '../../components/nutrition/MealCard';
import { MicronutrientGrid } from '../../components/nutrition/MicronutrientGrid';
import { TrendChart } from '../../components/nutrition/TrendChart';
import { useNutritionStore } from '../../store/nutritionStore';
import { AppHeader } from '@/components/common/AppHeader';

export default function NutritionScreen() {
  const router = useRouter();
  const {
    meals,
    goals,
    hydrationReminder,
    dailyReport,
    weeklyTrend,
    monthlyTrend,
    recommendations,
    isLoading,
    error,
    initialize,
  } = useNutritionStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <View style={styles.page}>
      <AppHeader title="Nutrition & Diet" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            Food logging, hydration, adaptive suggestions, and trend reporting in one place.
          </Text>
        </View>

      <CalorieProgress report={dailyReport} goals={goals} />

      <View style={styles.actionRow}>
        <Pressable style={[styles.action, styles.primaryAction]} onPress={() => router.push('/(modals)/meal-logger')}>
          <Text style={styles.primaryActionTitle}>Log food</Text>
          <Text style={styles.primaryActionText}>Create or edit meal entries with nutrient totals.</Text>
        </Pressable>
        <Pressable style={[styles.action, styles.secondaryAction]} onPress={() => router.push('/(modals)/water-tracker')}>
          <Text style={styles.secondaryActionTitle}>Track water</Text>
          <Text style={styles.secondaryActionText}>
            {dailyReport.waterConsumedMl} mL today â€¢ reminders {hydrationReminder.enabled ? 'on' : 'off'}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f766e" />
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>AI Suggestions</Text>
        {recommendations.map((recommendation) => (
          <View key={`${recommendation.category}-${recommendation.title}`} style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
            <Text style={styles.recommendationText}>{recommendation.description}</Text>
          </View>
        ))}
      </View>

      <MicronutrientGrid report={dailyReport} />
      <TrendChart title="Weekly Calories" points={weeklyTrend} metric="calories" color="#0f766e" />
      <TrendChart title="Weekly Protein" points={weeklyTrend} metric="protein" color="#1d4ed8" />
      <TrendChart title="Monthly Hydration" points={monthlyTrend} metric="waterMl" color="#0891b2" />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Today&apos;s Meals</Text>
        {meals.length ? (
          meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={() => router.push({ pathname: '/(modals)/meal-logger', params: { mealId: meal.id } })}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No meals logged yet. Start with breakfast, a snack, or a full recipe idea.</Text>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f4fbf8',
  },

  screen: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 14,
  },

  subtitle: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },

  /* ───── ACTION CARDS ───── */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
  },

  action: {
    borderRadius: 20,
    flex: 1,
    minHeight: 110,
    padding: 14,
  },

  primaryAction: {
    backgroundColor: '#0f766e',
  },

  secondaryAction: {
    backgroundColor: '#e6fffb',
  },

  primaryActionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },

  primaryActionText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },

  secondaryActionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },

  secondaryActionText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },

  /* ───── STATES ───── */
  loadingBox: {
    alignItems: 'center',
    marginVertical: 12,
  },

  errorBox: {
    backgroundColor: '#fff1f2',
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
  },

  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '400',
  },

  /* ───── CARDS ───── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 14,
    padding: 16,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },

  /* ───── AI RECOMMENDATIONS ───── */
  recommendation: {
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },

  recommendationTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },

  recommendationText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400',
  },

  /* ───── EMPTY ───── */
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});