import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProgressTrendPoint } from '@/types/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BodyMeasurementChart({ title, points }: { title: string; points: ProgressTrendPoint[] }) {
  const compact = SCREEN_WIDTH < 380;

  if (!points || points.length === 0) {
    return (
      <View style={[styles.card, compact ? styles.cardCompact : null]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyText}>Add body measurements to see your progress</Text>
        </View>
      </View>
    );
  }

  const fatData = points
    .map(p => ({
      value: p.bodyFatPercent,
      label: p.label ?? p.date.slice(5),
      date: p.date,
    }))
    .filter(d => d.value > 0);

  const muscleData = points
    .map(p => ({
      value: p.muscleMassKg,
      label: p.label ?? p.date.slice(5),
      date: p.date,
    }))
    .filter(d => d.value > 0);

  const latestFat = fatData[fatData.length - 1]?.value;
  const firstFat = fatData[0]?.value;
  const fatChange = latestFat && firstFat ? latestFat - firstFat : 0;
  const isImproving = fatChange < 0;

  const latestMuscle = muscleData[muscleData.length - 1]?.value;
  const firstMuscle = muscleData[0]?.value;
  const muscleChange = latestMuscle && firstMuscle ? latestMuscle - firstMuscle : 0;

  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      <LinearGradient
        colors={['#f8fafc', '#ffffff']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.summaryBadge}>
          <Ionicons name="trending-up" size={14} color={isImproving ? '#10b981' : '#ef4444'} />
          <Text style={[styles.summaryText, { color: isImproving ? '#10b981' : '#ef4444' }]}>
            {isImproving ? 'Improving' : 'Needs attention'}
          </Text>
        </View>
      </View>

      <View style={[styles.statsRow, compact ? styles.statsRowCompact : null]}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Body Fat</Text>
          <Text style={styles.statValue}>
            {latestFat?.toFixed(1) || '—'}%
          </Text>
          {fatChange !== 0 && (
            <View style={styles.statChange}>
              <Ionicons name={fatChange < 0 ? 'arrow-down' : 'arrow-up'} size={12} color={fatChange < 0 ? '#10b981' : '#ef4444'} />
              <Text style={[styles.statChangeText, { color: fatChange < 0 ? '#10b981' : '#ef4444' }]}>
                {Math.abs(fatChange).toFixed(1)}% {fatChange < 0 ? 'lost' : 'gained'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Current Muscle Mass</Text>
          <Text style={styles.statValue}>
            {latestMuscle?.toFixed(1) || '—'}kg
          </Text>
          {muscleChange !== 0 && (
            <View style={styles.statChange}>
              <Ionicons name={muscleChange > 0 ? 'arrow-up' : 'arrow-down'} size={12} color={muscleChange > 0 ? '#10b981' : '#ef4444'} />
              <Text style={[styles.statChangeText, { color: muscleChange > 0 ? '#10b981' : '#ef4444' }]}>
                {Math.abs(muscleChange).toFixed(1)}kg {muscleChange > 0 ? 'gained' : 'lost'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.legend, compact ? styles.legendCompact : null]}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>Body Fat %</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#0d9488' }]} />
          <Text style={styles.legendText}>Muscle Mass (kg)</Text>
        </View>
      </View>

      <View style={[styles.chartContainer, compact ? styles.chartContainerCompact : null]}>
        <LineChart
          data={fatData}
          data2={muscleData}
          width={compact ? SCREEN_WIDTH - 56 : SCREEN_WIDTH - 80}
          height={compact ? 180 : 200}
          color1="#f97316"
          color2="#0d9488"
          thickness={2.5}
          dataPointsColor1="#f97316"
          dataPointsColor2="#0d9488"
          dataPointsRadius={4}
          noOfSections={4}
          yAxisColor="#e2e8f0"
          xAxisColor="#e2e8f0"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          curved
          isAnimated
          animationDuration={800}
          pointerConfig={{
            pointerStripColor: '#94a3b8',
            pointerStripWidth: 1.5,
            pointerColor: '#64748b',
            radius: 5,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={styles.pointerLabel}>
                  <Text style={[styles.pointerText, { color: '#f97316' }]}>
                    Fat: {items[0]?.value?.toFixed(1)}%
                  </Text>
                  <Text style={[styles.pointerText, { color: '#0d9488' }]}>
                    Muscle: {items[1]?.value?.toFixed(1)}kg
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>

      <Text style={styles.footer}>
        Track changes over time to optimize your body composition
      </Text>
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
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statsRowCompact: {
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statChangeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingVertical: 8,
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
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '400',
  },
  chartContainer: {
    marginLeft: -10,
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
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  pointerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
  },
  footer: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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