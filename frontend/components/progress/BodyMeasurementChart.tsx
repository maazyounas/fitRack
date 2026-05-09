import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ProgressTrendPoint } from '@/types/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BodyMeasurementChart({ title, points }: { title: string; points: ProgressTrendPoint[] }) {
  if (!points || points.length === 0) return null;

  const fatData = points.map(p => ({
    value: p.bodyFatPercent,
    label: p.label ?? p.date.slice(5),
  })).filter(d => d.value > 0);

  const muscleData = points.map(p => ({
    value: p.muscleMassKg,
    label: p.label ?? p.date.slice(5),
  })).filter(d => d.value > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>Fat %</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#2563eb' }]} />
          <Text style={styles.legendText}>Muscle Mass (kg)</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={fatData}
          data2={muscleData}
          width={SCREEN_WIDTH - 80}
          height={180}
          color1="#f97316"
          color2="#2563eb"
          thickness={3}
          dataPointsColor1="#f97316"
          dataPointsColor2="#2563eb"
          noOfSections={4}
          yAxisColor="#e2e8f0"
          xAxisColor="#e2e8f0"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          curved
          pointerConfig={{
            pointerStripColor: '#cbd5e1',
            pointerStripWidth: 2,
            pointerColor: '#cbd5e1',
            radius: 4,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={styles.pointerLabel}>
                  <Text style={[styles.pointerText, { color: '#f97316' }]}>Fat: {items[0].value}%</Text>
                  <Text style={[styles.pointerText, { color: '#2563eb' }]}>Muscle: {items[1].value}kg</Text>
                </View>
              );
            },
          }}
        />
      </View>
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
  title: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  chartContainer: { marginLeft: -10 },
  axisText: { color: '#94a3b8', fontSize: 10 },
  pointerLabel: {
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    width: 120,
  },
  pointerText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
});
