import { StyleSheet, Text, View } from 'react-native';
import { DailyNutritionReport } from '@/types/nutrition';

const nutrientMeta = [
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg' },
] as const;

export function MicronutrientGrid({ report }: { report: DailyNutritionReport }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Micronutrients</Text>
      <View style={styles.grid}>
        {nutrientMeta.map((nutrient) => (
          <View key={nutrient.key} style={styles.cell}>
            <Text style={styles.label}>{nutrient.label}</Text>
            <Text style={styles.value}>
              {report.totals[nutrient.key]} {nutrient.unit}
            </Text>
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
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    minWidth: '47%',
    padding: 12,
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
