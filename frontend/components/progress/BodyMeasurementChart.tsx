import { StyleSheet, Text, View } from 'react-native';
import { ProgressTrendPoint } from '@/types/progress';

export function BodyMeasurementChart({ title, points }: { title: string; points: ProgressTrendPoint[] }) {
  const maxFat = Math.max(...points.map((point) => point.bodyFatPercent), 1);
  const maxMuscle = Math.max(...points.map((point) => point.muscleMassKg), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {points.map((point) => (
        <View key={`${title}-${point.date}`} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>{point.label ?? point.date.slice(5)}</Text>
            <Text style={styles.meta}>
              Fat {point.bodyFatPercent.toFixed(1)}% • Muscle {point.muscleMassKg.toFixed(1)}kg
            </Text>
          </View>
          <View style={styles.bars}>
            <View style={styles.track}>
              <View style={[styles.fatBar, { width: `${(point.bodyFatPercent / maxFat) * 100}%` }]} />
            </View>
            <View style={styles.track}>
              <View style={[styles.muscleBar, { width: `${(point.muscleMassKg / maxMuscle) * 100}%` }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, padding: 18 },
  title: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  row: { marginBottom: 12 },
  copy: { marginBottom: 6 },
  label: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  meta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  bars: { gap: 6 },
  track: { backgroundColor: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden' },
  fatBar: { backgroundColor: '#f97316', borderRadius: 999, height: '100%' },
  muscleBar: { backgroundColor: '#2563eb', borderRadius: 999, height: '100%' },
});
