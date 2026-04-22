import { StyleSheet, Text, View } from 'react-native';
import { DailyNutritionReport, NutritionGoals } from '@/types/nutrition';

export function CalorieProgress({
  report,
  goals,
}: {
  report: DailyNutritionReport;
  goals: NutritionGoals;
}) {
  const calorieProgress = Math.min(report.totals.calories / Math.max(goals.calories, 1), 1);
  const waterProgress = Math.min(report.waterConsumedMl / Math.max(goals.waterMl, 1), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Daily Summary</Text>
      <Text style={styles.headline}>
        {report.totals.calories} / {goals.calories} kcal
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${calorieProgress * 100}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <Stat label="Protein" value={`${report.totals.protein}g / ${goals.protein}g`} />
        <Stat label="Carbs" value={`${report.totals.carbs}g / ${goals.carbs}g`} />
        <Stat label="Fats" value={`${report.totals.fats}g / ${goals.fats}g`} />
        <Stat label="Fiber" value={`${report.totals.fiber}g / ${goals.fiber}g`} />
      </View>

      <View style={styles.hydrationBox}>
        <View>
          <Text style={styles.hydrationLabel}>Hydration</Text>
          <Text style={styles.hydrationValue}>
            {report.waterConsumedMl} / {goals.waterMl} mL
          </Text>
        </View>
        <View style={styles.waterTrack}>
          <View style={[styles.waterFill, { width: `${waterProgress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 20,
  },
  eyebrow: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  headline: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14,
  },
  track: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    height: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#2dd4bf',
    borderRadius: 999,
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    backgroundColor: '#111827',
    borderRadius: 18,
    minWidth: '47%',
    padding: 12,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  hydrationBox: {
    backgroundColor: '#082f49',
    borderRadius: 20,
    marginTop: 16,
    padding: 14,
  },
  hydrationLabel: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hydrationValue: {
    color: '#f0f9ff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  waterTrack: {
    backgroundColor: '#0c4a6e',
    borderRadius: 999,
    height: 10,
    marginTop: 12,
    overflow: 'hidden',
  },
  waterFill: {
    backgroundColor: '#7dd3fc',
    borderRadius: 999,
    height: '100%',
  },
});
