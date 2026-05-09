import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ProgressTrendPoint } from '@/types/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function WeightChart({ title, points }: { title: string; points: ProgressTrendPoint[] }) {
  if (!points || points.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>Not enough data to show trend.</Text>
      </View>
    );
  }

  const chartData = points.map(p => ({
    value: p.weightKg,
    label: p.label ?? p.date.slice(5),
    dataPointText: p.weightKg > 0 ? p.weightKg.toFixed(1) : undefined
  })).filter(d => d.value > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 80}
          height={180}
          color="#0f766e"
          thickness={3}
          dataPointsColor="#0f766e"
          dataPointsRadius={4}
          noOfSections={4}
          yAxisColor="#e2e8f0"
          xAxisColor="#e2e8f0"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideDataPoints={false}
          curved
          areaChart
          startFillColor="rgba(15, 118, 110, 0.3)"
          endFillColor="rgba(15, 118, 110, 0.01)"
          pointerConfig={{
            pointerStripColor: '#0f766e',
            pointerStripWidth: 2,
            pointerColor: '#0f766e',
            radius: 6,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={styles.pointerLabel}>
                  <Text style={styles.pointerText}>{items[0].value} kg</Text>
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
  title: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 20 },
  chartContainer: {
    marginLeft: -10,
  },
  empty: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 40,
  },
  axisText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  pointerLabel: {
    backgroundColor: '#0f172a',
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
