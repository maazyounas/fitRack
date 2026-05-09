import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DailyNutritionReport, NutritionGoals } from '@/types/nutrition';

const CIRCLE_RADIUS = 30;
const CIRCLE_STROKE = 6;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function CircularProgress({
  progress,
  color,
  label,
  value,
}: {
  progress: number;
  color: string;
  label: string;
  value: string;
}) {
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - Math.min(progress, 1) * CIRCLE_CIRCUMFERENCE;

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
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Daily Summary</Text>
      <Text style={styles.headline}>
        {report.totals.calories} kcal
      </Text>
      <Text style={styles.subHeadline}>
        {remainingCalories} kcal remaining of {goals.calories} kcal TDEE
      </Text>
      
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${calorieProgress * 100}%` }]} />
      </View>

      <View style={styles.macroRingsContainer}>
        <CircularProgress
          progress={report.totals.protein / Math.max(goals.protein, 1)}
          color="#3b82f6" // blue
          label="Protein"
          value={`${report.totals.protein}g`}
        />
        <CircularProgress
          progress={report.totals.carbs / Math.max(goals.carbs, 1)}
          color="#f59e0b" // amber
          label="Carbs"
          value={`${report.totals.carbs}g`}
        />
        <CircularProgress
          progress={report.totals.fats / Math.max(goals.fats, 1)}
          color="#ef4444" // red
          label="Fats"
          value={`${report.totals.fats}g`}
        />
        <CircularProgress
          progress={report.totals.fiber / Math.max(goals.fiber, 1)}
          color="#10b981" // emerald
          label="Fiber"
          value={`${report.totals.fiber}g`}
        />
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
    marginBottom: 4,
  },
  subHeadline: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  track: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    height: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#2dd4bf',
    borderRadius: 999,
    height: '100%',
  },
  macroRingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  circleWrapper: {
    alignItems: 'center',
    position: 'relative',
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
    fontSize: 12,
    fontWeight: '800',
  },
  circleLabelText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
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
