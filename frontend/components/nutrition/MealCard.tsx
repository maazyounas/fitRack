import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MealEntry } from '@/types/nutrition';

const mealTypeColors = {
  breakfast: '#f59e0b',
  lunch: '#0f766e',
  dinner: '#1d4ed8',
  snack: '#7c3aed',
};

export function MealCard({ meal, onEdit }: { meal: MealEntry; onEdit: () => void }) {
  const time = new Date(meal.consumedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={[styles.badge, { backgroundColor: mealTypeColors[meal.mealType] }]} />
          <View>
            <Text style={styles.title}>{meal.name}</Text>
            <Text style={styles.subtitle}>
              {meal.mealType} • {time}
            </Text>
          </View>
        </View>
        <Pressable onPress={onEdit}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.macros}>
        <Text style={styles.metric}>{meal.totals.calories} kcal</Text>
        <Text style={styles.metric}>P {meal.totals.protein}g</Text>
        <Text style={styles.metric}>C {meal.totals.carbs}g</Text>
        <Text style={styles.metric}>F {meal.totals.fats}g</Text>
      </View>

      {meal.foods.map((food) => (
        <View key={food.id ?? `${food.name}-${food.quantity}`} style={styles.foodRow}>
          <Text style={styles.foodName}>
            {food.quantity} {food.unit} {food.name}
          </Text>
          <Text style={styles.foodCalories}>{food.nutrients.calories} kcal</Text>
        </View>
      ))}

      {meal.notes ? <Text style={styles.notes}>{meal.notes}</Text> : null}
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  edit: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '700',
  },
  macros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metric: {
    backgroundColor: '#ecfeff',
    borderRadius: 999,
    color: '#155e75',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  foodName: {
    color: '#0f172a',
    flex: 1,
    fontSize: 13,
    marginRight: 12,
  },
  foodCalories: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  notes: {
    color: '#475569',
    fontSize: 13,
    marginTop: 8,
  },
});
