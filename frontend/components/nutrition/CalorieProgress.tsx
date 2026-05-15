import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { DailyNutritionReport, NutritionGoals } from '@/types/nutrition';

const CIRCLE_RADIUS = 30;
const CIRCLE_STROKE = 5;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function CircularProgress({
  progress,
  color,
  gradientColors,
  label,
  value,
}: {
  progress: number;
  color: string;
  gradientColors?: string[];
  label: string;
  value: string;
}) {
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - Math.min(progress, 1) * CIRCLE_CIRCUMFERENCE;
  const displayProgress = Math.min(Math.round(progress * 100), 100);

  return (
    <View style={styles.circleWrapper}>
      <Svg width={(CIRCLE_RADIUS + CIRCLE_STROKE) * 2} height={(CIRCLE_RADIUS + CIRCLE_STROKE) * 2}>
        <Circle
          cx={CIRCLE_RADIUS + CIRCLE_STROKE}
          cy={CIRCLE_RADIUS + CIRCLE_STROKE}
          r={CIRCLE_RADIUS}
          stroke="#1e293b"
          strokeWidth={CIRCLE_STROKE}
          fill="none"
        />
        <Circle
          cx={CIRCLE_RADIUS + CIRCLE_STROKE}
          cy={CIRCLE_RADIUS + CIRCLE_STROKE}
          r={CIRCLE_RADIUS}
          stroke={color}
          strokeWidth={CIRCLE_STROKE}
          fill="none"
          strokeDasharray={CIRCLE_CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CIRCLE_RADIUS + CIRCLE_STROKE} ${CIRCLE_RADIUS + CIRCLE_STROKE})`}
        />
      </Svg>
      <View style={styles.circleLabelContainer}>
        <Text style={styles.circleValueText}>{value}</Text>
        <Text style={styles.circlePercentText}>{displayProgress}%</Text>
      </View>
      <Text style={styles.circleLabelText}>{label}</Text>
    </View>
  );
}

export function CalorieProgress({
  report,
  goals,
}: {
  report: DailyNutritionReport;
  goals: NutritionGoals;
}) {
  const calorieProgress = Math.min(report.totals.calories / Math.max(goals.calories, 1), 1);
  const waterProgress = Math.min(report.waterConsumedMl / Math.max(goals.waterMl, 1), 1);
  const remainingCalories = Math.max(0, goals.calories - report.totals.calories);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.card}>
      <Text style={styles.eyebrow}>Today&apos;s Summary</Text>
      <Text style={styles.headline}>
        {report.totals.calories} <Text style={styles.headlineUnit}>kcal</Text>
      </Text>
      <Text style={styles.subHeadline}>
        {remainingCalories} kcal remaining of {goals.calories}
      </Text>
      
      <View style={styles.progressSection}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${calorieProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(calorieProgress * 100)}%</Text>
      </View>

      <View style={styles.macroRingsContainer}>
        <CircularProgress
          progress={report.totals.protein / Math.max(goals.protein, 1)}
          color="#3b82f6"
          gradientColors={['#3b82f6', '#60a5fa']}
          label="Protein"
          value={`${report.totals.protein}g`}
        />
        <CircularProgress
          progress={report.totals.carbs / Math.max(goals.carbs, 1)}
          color="#f59e0b"
          gradientColors={['#f59e0b', '#fbbf24']}
          label="Carbs"
          value={`${report.totals.carbs}g`}
        />
        <CircularProgress
          progress={report.totals.fats / Math.max(goals.fats, 1)}
          color="#ef4444"
          gradientColors={['#ef4444', '#f87171']}
          label="Fats"
          value={`${report.totals.fats}g`}
        />
        <CircularProgress
          progress={report.totals.fiber / Math.max(goals.fiber, 1)}
          color="#10b981"
          gradientColors={['#10b981', '#34d399']}
          label="Fiber"
          value={`${report.totals.fiber}g`}
        />
      </View>

      <View style={styles.hydrationBox}>
        <View style={styles.hydrationHeader}>
          <View>
            <Text style={styles.hydrationLabel}>Water intake</Text>
            <Text style={styles.hydrationValue}>
              {report.waterConsumedMl} / {goals.waterMl} mL
            </Text>
          </View>
          <View style={styles.hydrationBadge}>
            <Text style={styles.hydrationBadgeText}>{Math.round(waterProgress * 100)}%</Text>
          </View>
        </View>
        <View style={styles.waterTrack}>
          <View style={[styles.waterFill, { width: `${waterProgress * 100}%` }]} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  eyebrow: {
    color: '#5eead4',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headline: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headlineUnit: {
    fontSize: 18,
    fontWeight: '400',
    color: '#94a3b8',
  },
  subHeadline: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  track: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#2dd4bf',
    borderRadius: 6,
    height: '100%',
  },
  progressPercent: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'right',
  },
  macroRingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  circleWrapper: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  circleLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: (CIRCLE_RADIUS + CIRCLE_STROKE) * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleValueText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  circlePercentText: {
    color: '#5eead4',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  circleLabelText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 6,
  },
  hydrationBox: {
    backgroundColor: '#082f49',
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hydrationLabel: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  hydrationValue: {
    color: '#f0f9ff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  hydrationBadge: {
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hydrationBadgeText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '600',
  },
  waterTrack: {
    backgroundColor: '#0c4a6e',
    borderRadius: 5,
    height: 6,
    overflow: 'hidden',
  },
  waterFill: {
    backgroundColor: '#7dd3fc',
    borderRadius: 5,
    height: '100%',
  },
});