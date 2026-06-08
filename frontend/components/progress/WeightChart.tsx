import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressTrendPoint } from '@/types/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function WeightChart({
  title,
  points,
  compact: compactOverride,
}: {
  title: string;
  points: ProgressTrendPoint[];
  compact?: boolean;
}) {
  const compact = compactOverride ?? SCREEN_WIDTH < 380;

  if (!points || points.length === 0) {
    return (
      <View style={[styles.card, compact ? styles.cardCompact : null]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="scale-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No weight data</Text>
          <Text style={styles.emptyText}>Log your weight to track progress over time</Text>
        </View>
      </View>
    );
  }

  const chartData = points
    .map(p => ({
      value: p.weightKg,
      label: p.label ?? p.date.slice(5),
      date: p.date,
    }))
    .filter(d => d.value > 0);

  const firstWeight = chartData[0]?.value;
  const lastWeight = chartData[chartData.length - 1]?.value;
  const totalChange = lastWeight && firstWeight ? lastWeight - firstWeight : 0;
  const weeklyChange = chartData.length > 1 ? totalChange / (chartData.length - 1) : 0;
  const isLosingWeight = totalChange < 0;

  const weightGoal = 75; // Example goal - should come from user settings
  const goalProgress = lastWeight && weightGoal ? ((lastWeight - firstWeight) / (weightGoal - firstWeight)) * 100 : 0;

  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.gradient} />
      
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.trendBadge, isLosingWeight ? styles.downTrend : styles.upTrend]}>
          <Ionicons name={isLosingWeight ? 'arrow-down' : 'arrow-up'} size={14} color={isLosingWeight ? '#10b981' : '#ef4444'} />
          <Text style={[styles.trendText, { color: isLosingWeight ? '#10b981' : '#ef4444' }]}>
            {Math.abs(totalChange).toFixed(1)} kg {isLosingWeight ? 'lost' : 'gained'}
          </Text>
        </View>
      </View>

      <View style={[styles.statsRow, compact ? styles.statsRowCompact : null]}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Weight</Text>
          <Text style={styles.statValue}>
            {lastWeight?.toFixed(1)} <Text style={styles.statUnit}>kg</Text>
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Starting Weight</Text>
          <Text style={styles.statValue}>
            {firstWeight?.toFixed(1)} <Text style={styles.statUnit}>kg</Text>
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Weekly Avg Δ</Text>
          <Text style={[styles.statValue, { color: weeklyChange < 0 ? '#10b981' : weeklyChange > 0 ? '#ef4444' : '#64748b' }]}>
            {weeklyChange > 0 ? '+' : ''}{weeklyChange?.toFixed(1)}
            <Text style={styles.statUnit}>kg</Text>
          </Text>
        </View>
      </View>

      {weightGoal && lastWeight && (
        <View style={styles.goalSection}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>Goal Progress: {weightGoal} kg</Text>
            <Text style={styles.goalPercent}>{Math.min(100, Math.max(0, Math.round(goalProgress)))}%</Text>
          </View>
          <View style={styles.goalBar}>
            <View style={[styles.goalFill, { width: `${Math.min(100, Math.max(0, goalProgress))}%` }]} />
          </View>
        </View>
      )}

      <View style={[styles.chartContainer, compact ? styles.chartContainerCompact : null]}>
        <LineChart
          data={chartData}
          width={compact ? SCREEN_WIDTH - 56 : SCREEN_WIDTH - 80}
          height={compact ? 180 : 200}
          color="#0d9488"
          thickness={2.5}
          dataPointsColor="#0d9488"
          dataPointsRadius={4}
          noOfSections={4}
          yAxisColor="#e2e8f0"
          xAxisColor="#e2e8f0"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideDataPoints={false}
          curved
          isAnimated
          animationDuration={800}
          areaChart
          startFillColor="rgba(13, 148, 136, 0.25)"
          endFillColor="rgba(13, 148, 136, 0.01)"
          pointerConfig={{
            pointerStripColor: '#0d9488',
            pointerStripWidth: 1.5,
            pointerColor: '#0d9488',
            radius: 5,
            pointerLabelComponent: (items: any) => {
              return (
                <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.pointerLabel}>
                  <Text style={styles.pointerWeight}>{items[0].value.toFixed(1)} kg</Text>
                  <Text style={styles.pointerDate}>{items[0].label}</Text>
                </LinearGradient>
              );
            },
          }}
        />
      </View>

      <View style={styles.insights}>
        <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
        <Text style={styles.insightsText}>
          {isLosingWeight 
            ? "Great progress! Keep up the consistency with your nutrition and workouts."
            : totalChange > 0 
              ? "Focus on nutrition and progressive overload to reach your weight goals."
              : "Start tracking regularly to see meaningful trends over time."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardCompact: {
    marginHorizontal: 0,
    padding: 16,
    borderRadius: 20,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  downTrend: {
    backgroundColor: '#ecfdf5',
  },
  upTrend: {
    backgroundColor: '#fef2f2',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statsRowCompact: {
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
  },
  goalSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0fdfa',
    borderRadius: 14,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0d9488',
  },
  goalPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0d9488',
  },
  goalBar: {
    height: 6,
    backgroundColor: '#ccfbf1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 3,
  },
  chartContainer: {
    marginLeft: -10,
    marginBottom: 16,
  },
  chartContainerCompact: {
    marginLeft: -6,
  },
  axisText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '400',
  },
  pointerLabel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  pointerWeight: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
  },
  pointerDate: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '400',
  },
  insights: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  insightsText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
  },
});