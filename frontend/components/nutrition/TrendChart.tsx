import { StyleSheet, Text, View } from 'react-native';
import { TrendPoint } from '@/types/nutrition';

export function TrendChart({
  title,
  points,
  metric,
  color,
}: {
  title: string;
  points: TrendPoint[];
  metric: 'calories' | 'protein' | 'waterMl';
  color: string;
}) {
  const maxValue = Math.max(...points.map((point) => point[metric]), 1);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {points.map((point) => (
          <View key={`${metric}-${point.date}`} style={styles.column}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: color,
                    height: `${(point[metric] / maxValue) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.value}>{Math.round(point[metric])}</Text>
            <Text style={styles.label}>{point.label}</Text>
          </View>
        ))}
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
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 180,
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 110,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  bar: {
    borderRadius: 999,
    width: '100%',
  },
  value: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  label: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
  },
});
