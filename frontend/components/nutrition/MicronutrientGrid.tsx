import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyNutritionReport } from '@/types/nutrition';

const nutrientMeta = [
  { key: 'sodium', label: 'Sodium', unit: 'mg', icon: 'water-outline', color: '#3b82f6' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', icon: 'leaf-outline', color: '#10b981' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', icon: 'bone-outline', color: '#f59e0b' },
  { key: 'iron', label: 'Iron', unit: 'mg', icon: 'fitness-outline', color: '#ef4444' },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', icon: 'nutrition-outline', color: '#8b5cf6' },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg', icon: 'sunny-outline', color: '#06b6d4' },
] as const;

export function MicronutrientGrid({ report }: { report: DailyNutritionReport }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="leaf-outline" size={20} color="#0d9488" />
        <Text style={styles.title}>Micronutrients</Text>
      </View>
      
      <View style={styles.grid}>
        {nutrientMeta.map((nutrient) => {
          const value = report.totals[nutrient.key];
          const isLow = value < 50;
          
          return (
            <View key={nutrient.key} style={styles.cell}>
              <View style={[styles.cellIcon, { backgroundColor: `${nutrient.color}10` }]}>
                <Ionicons name={nutrient.icon as any} size={18} color={nutrient.color} />
              </View>
              <View style={styles.cellContent}>
                <Text style={styles.cellLabel}>{nutrient.label}</Text>
                <Text style={styles.cellValue}>
                  {value} <Text style={styles.cellUnit}>{nutrient.unit}</Text>
                </Text>
                {isLow && (
                  <View style={styles.lowBadge}>
                    <Text style={styles.lowText}>Low</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
      
      <Text style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={12} color="#94a3b8" />
        {' '}Aim to meet daily micronutrient targets for optimal health
      </Text>
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    width: '48%',
  },
  cellIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellContent: {
    flex: 1,
  },
  cellLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 2,
  },
  cellValue: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
  },
  cellUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
  },
  lowBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  lowText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#d97706',
  },
  footerNote: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
    marginTop: 16,
    textAlign: 'center',
  },
});