import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressTrendPoint } from '@/types/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PerformanceChart({ points }: { points: ProgressTrendPoint[] }) {
  const compact = SCREEN_WIDTH < 380;

  if (!points || points.length === 0) {
    return (
      <View style={[styles.card, compact ? styles.cardCompact : null]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No performance data</Text>
          <Text style={styles.emptyText}>Complete workouts to see your strength index</Text>
        </View>
      </View>
    );
  }

  const data = points
    .map(p => ({
      value: p.performanceScore,
      label: p.label ?? p.date.slice(5),
      frontColor: p.performanceScore >= 80 ? '#10b981' : p.performanceScore >= 60 ? '#f59e0b' : '#ef4444',
      gradientColor: p.performanceScore >= 80 ? '#34d399' : p.performanceScore >= 60 ? '#fbbf24' : '#f87171',
    }))
    .filter(d => d.value > 0);

  const averageScore = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const latestScore = data[data.length - 1]?.value;
  const bestScore = Math.max(...data.map(d => d.value));
  const trend = latestScore && averageScore ? latestScore - averageScore : 0;

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Elite';
    if (score >= 75) return 'Advanced';
    if (score >= 60) return 'Intermediate';
    if (score >= 40) return 'Beginner';
    return 'Starting';
  };

  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.gradient} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Strength Performance</Text>
        {latestScore && (
          <View style={styles.performanceBadge}>
            <Text style={styles.performanceLabel}>{getPerformanceLabel(latestScore)}</Text>
          </View>
        )}
      </View>

      <View style={[styles.statsGrid, compact ? styles.statsGridCompact : null]}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Current Score</Text>
          <Text style={styles.statBoxValue}>{Math.round(latestScore || 0)}</Text>
          <Text style={styles.statBoxUnit}>/100</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Best Score</Text>
          <Text style={styles.statBoxValue}>{Math.round(bestScore)}</Text>
          <View style={styles.trendBadge}>
            <Ionicons name="arrow-up" size={10} color="#10b981" />
            <Text style={styles.trendText}>+{Math.round(bestScore - (data[0]?.value || 0))}</Text>
          </View>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Avg. Score</Text>
          <Text style={styles.statBoxValue}>{Math.round(averageScore)}</Text>
          <View style={[styles.trendBadge, trend > 0 ? styles.positiveTrend : styles.negativeTrend]}>
            <Ionicons name={trend > 0 ? 'trending-up' : 'trending-down'} size={10} color={trend > 0 ? '#10b981' : '#ef4444'} />
            <Text style={[styles.trendText, { color: trend > 0 ? '#10b981' : '#ef4444' }]}>
              {trend > 0 ? '+' : ''}{Math.round(trend)}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.chartContainer, compact ? styles.chartContainerCompact : null]}>
        <BarChart
          data={data}
          width={compact ? SCREEN_WIDTH - 56 : SCREEN_WIDTH - 80}
          height={compact ? 180 : 200}
          barWidth={compact ? 20 : 24}
          noOfSections={5}
          barBorderRadius={6}
          frontColor="#7c3aed"
          gradientColor="#a78bfa"
          yAxisColor="#e2e8f0"
          xAxisColor="#e2e8f0"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          animationDuration={800}
          renderTooltip={(item: any) => {
            return (
              <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.tooltip}>
                <Text style={styles.tooltipValue}>{Math.round(item.value)}</Text>
                <Text style={styles.tooltipLabel}>SPI Score</Text>
              </LinearGradient>
            );
          }}
        />
      </View>

      <View style={[styles.legend, compact ? styles.legendCompact : null]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Beginner (0-39)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Intermediate (40-59)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Advanced (60+)</Text>
        </View>
      </View>

      <Text style={styles.footer}>Based on estimated 1RM across all tracked lifts</Text>
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
  performanceBadge: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0d9488',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statsGridCompact: {
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  statBoxUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  positiveTrend: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  negativeTrend: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
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
  tooltip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipValue: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
  },
  tooltipLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '400',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  legendCompact: {
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748b',
  },
  footer: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
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