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
    backgroundColor: '#eef6f2',
  },
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    marginTop: 14,
  },
  action: {
    borderRadius: 24,
    flex: 1,
    minHeight: 122,
    padding: 16,
  },
  primaryAction: {
    backgroundColor: '#115e59',
  },
  secondaryAction: {
    backgroundColor: '#cffafe',
  },
  primaryActionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  primaryActionText: {
    color: '#d1fae5',
    fontSize: 13,
    lineHeight: 18,
  },
  secondaryActionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  secondaryActionText: {
    color: '#155e75',
    fontSize: 13,
    lineHeight: 18,
  },
  loadingBox: {
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 12,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    marginBottom: 14,
    padding: 14,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 14,
    padding: 18,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  recommendation: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  recommendationTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  recommendationText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});

