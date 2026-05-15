import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MealEntry } from '@/types/nutrition';

const mealTypeConfig = {
  breakfast: { color: '#f59e0b', icon: 'sunny-outline', label: 'Breakfast' },
  lunch: { color: '#0d9488', icon: 'restaurant-outline', label: 'Lunch' },
  dinner: { color: '#3b82f6', icon: 'moon-outline', label: 'Dinner' },
  snack: { color: '#8b5cf6', icon: 'cafe-outline', label: 'Snack' },
};

export function MealCard({ meal, onEdit }: { meal: MealEntry; onEdit: () => void }) {
  const time = new Date(meal.consumedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const config = mealTypeConfig[meal.mealType];

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${config.color}10`, '#ffffff']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}15` }]}>
            <Ionicons name={config.icon as any} size={20} color={config.color} />
          </View>
          <View>
            <Text style={styles.title}>{meal.name}</Text>
            <View style={styles.subtitleRow}>
              <Text style={styles.subtitle}>{config.label}</Text>
              <View style={styles.dot} />
              <Text style={styles.subtitle}>{time}</Text>
            </View>
          </View>
        </View>
        <Pressable onPress={onEdit} style={styles.editButton}>
          <Ionicons name="create-outline" size={16} color="#0d9488" />
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.macros}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.totals.calories}</Text>
          <Text style={styles.macroLabel}>kcal</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.totals.protein}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.totals.carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={styles.macroDivider} />
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{meal.totals.fats}g</Text>
          <Text style={styles.macroLabel}>Fats</Text>
        </View>
      </View>

      <View style={styles.foodsList}>
        {meal.foods.slice(0, 3).map((food, idx) => (
          <View key={food.id ?? `${food.name}-${idx}`} style={styles.foodRow}>
            <Text style={styles.foodName}>
              {food.quantity} {food.unit} {food.name}
            </Text>
            <Text style={styles.foodCalories}>{food.nutrients.calories} kcal</Text>
          </View>
        ))}
        {meal.foods.length > 3 && (
          <Text style={styles.moreText}>+{meal.foods.length - 3} more items</Text>
        )}
      </View>

      {meal.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="chatbubble-outline" size={12} color="#94a3b8" />
          <Text style={styles.notes}>{meal.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '400',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editText: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '500',
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#64748b',
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  foodsList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  foodName: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '400',
    flex: 1,
  },
  foodCalories: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 4,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  notes: {
    flex: 1,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '400',
    fontStyle: 'italic',
  },
});