import { StyleSheet, Text, View } from 'react-native';
import { ProgressTrendPoint } from '@/types/progress';

export function WeightChart({ title, points }: { title: string; points: ProgressTrendPoint[] }) {
  const max = Math.max(...points.map((point) => point.weightKg), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {points.map((point) => (
          <View key={`${title}-${point.date}`} style={styles.column}>
            <View style={styles.track}>
              <View style={[styles.bar, { height: `${(point.weightKg / max) * 100}%` }]} />
            </View>
            <Text style={styles.value}>{point.weightKg ? point.weightKg.toFixed(1) : '-'}</Text>
            <Text style={styles.label}>{point.label ?? point.date.slice(5)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, padding: 18 },
  title: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  chart: { alignItems: 'flex-end', flexDirection: 'row', gap: 8, height: 180 },
  column: { alignItems: 'center', flex: 1 },
  track: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 110,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  bar: { backgroundColor: '#0f766e', borderRadius: 999, width: '100%' },
  value: { color: '#0f172a', fontSize: 11, fontWeight: '700', marginTop: 8 },
  label: { color: '#64748b', fontSize: 10, marginTop: 4 },
});
