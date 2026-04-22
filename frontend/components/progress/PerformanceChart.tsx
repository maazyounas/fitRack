import { StyleSheet, Text, View } from 'react-native';
import { ProgressTrendPoint } from '@/types/progress';

export function PerformanceChart({ points }: { points: ProgressTrendPoint[] }) {
  const max = Math.max(...points.map((point) => point.performanceScore), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Gym Performance Trend</Text>
      {points.map((point) => (
        <View key={point.date} style={styles.row}>
          <Text style={styles.label}>{point.label ?? point.date.slice(5)}</Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${(point.performanceScore / max) * 100}%` }]} />
          </View>
          <Text style={styles.value}>{Math.round(point.performanceScore)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, padding: 18 },
  title: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  row: { alignItems: 'center', flexDirection: 'row', marginBottom: 10 },
  label: { color: '#334155', fontSize: 12, width: 36 },
  track: { backgroundColor: '#e2e8f0', borderRadius: 999, flex: 1, height: 10, overflow: 'hidden' },
  bar: { backgroundColor: '#7c3aed', borderRadius: 999, height: '100%' },
  value: { color: '#0f172a', fontSize: 12, fontWeight: '700', marginLeft: 10, width: 34 },
});
