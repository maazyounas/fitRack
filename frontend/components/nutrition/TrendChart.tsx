import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TrendPoint } from '@/types/nutrition';

const metricConfig = {
  calories: { label: 'Calories', unit: 'kcal', icon: 'flame-outline', color: '#f59e0b' },
  protein: { label: 'Protein', unit: 'g', icon: 'fitness-outline', color: '#3b82f6' },
  waterMl: { label: 'Water', unit: 'mL', icon: 'water-outline', color: '#0d9488' },
};

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
  const config = metricConfig[metric];
  
  const getTrendIcon = (): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap => {
    if (points.length < 2) return 'trending-up-outline';
    const first = points[0][metric];
    const last = points[points.length - 1][metric];
    if (last > first) return 'trending-up-outline';
    if (last < first) return 'trending-down-outline';
    return 'trending-down-outline';
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={config.icon as any} size={18} color={color} />
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {config.label} • Last {points.length} days
            </Text>
          </View>
        </View>
        <View style={styles.trendBadge}>
          <Ionicons name={getTrendIcon()} size={14} color={color} />
          <Text style={[styles.trendText, { color }]}>
            {points.length > 1 ? `${Math.round((points[points.length - 1][metric] - points[0][metric]) / points[0][metric] * 100)}%` : '0%'}
          </Text>
        </View>
      </View>

      <View style={styles.chart}>
        {points.map((point, index) => {
          const heightPercent = (point[metric] / maxValue) * 100;
          const isLast = index === points.length - 1;
          
          return (
            <View key={`${metric}-${point.date}`} style={styles.column}>
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={[color, `${color}80`]}
                  style={[
                    styles.bar,
                    { height: `${Math.max(heightPercent, 4)}%` },
                  ]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
              </View>
              <Text style={[styles.value, isLast && styles.valueHighlight]}>
                {Math.round(point[metric])}
              </Text>
              <Text style={[styles.label, isLast && styles.labelHighlight]}>
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average</Text>
          <Text style={styles.summaryValue}>
            {Math.round(points.reduce((sum, p) => sum + p[metric], 0) / points.length)} {config.unit}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Peak</Text>
          <Text style={styles.summaryValue}>
            {Math.round(maxValue)} {config.unit}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 150,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  value: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  valueHighlight: {
    color: '#1e293b',
    fontSize: 12,
  },
  label: {
    fontSize: 9,
    color: '#cbd5e1',
  },
  labelHighlight: {
    color: '#0f766e',
    fontWeight: '500',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
});