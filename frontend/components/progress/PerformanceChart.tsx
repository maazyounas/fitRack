import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { ProgressTrendPoint } from '@/types/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PerformanceChart({ points }: { points: ProgressTrendPoint[] }) {
  if (!points || points.length === 0) return null;

  const data = points.map(p => ({
    value: p.performanceScore,
    label: p.label ?? p.date.slice(5),
    frontColor: '#7c3aed',
  })).filter(d => d.value > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Strength Performance Index</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={data}
          width={SCREEN_WIDTH - 80}
          height={180}
          barWidth={22}
          noOfSections={4}
          barBorderRadius={4}
          frontColor="#7c3aed"
          yAxisColor="#e2e8f0"
          xAxisColor="#e2e8f0"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          renderTooltip={(item: any) => {
            return (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>{Math.round(item.value)}</Text>
              </View>
            );
          }}
        />
      </View>
      <Text style={styles.footer}>Based on estimated 1RM volume across all lifts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    marginBottom: 14, 
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  title: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  chartContainer: { marginLeft: -10 },
  axisText: { color: '#94a3b8', fontSize: 10 },
  tooltip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
