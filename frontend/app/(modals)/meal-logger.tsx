import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FoodSearch } from '@/components/nutrition/FoodSearch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FoodItem, MealPayload, MealType, NutrientTotals } from '@/types/nutrition';
import { useNutritionStore } from '@/store/nutritionStore';

const emptyTotals: NutrientTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  potassium: 0,
  calcium: 0,
  iron: 0,
  vitaminC: 0,
  vitaminD: 0,
};

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const mealTypeConfig = {
  breakfast: { icon: 'sunny-outline', color: '#f59e0b', label: 'Breakfast' },
  lunch: { icon: 'restaurant-outline', color: '#0d9488', label: 'Lunch' },
  dinner: { icon: 'moon-outline', color: '#3b82f6', label: 'Dinner' },
  snack: { icon: 'cafe-outline', color: '#8b5cf6', label: 'Snack' },
};

function createFoodId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function FoodItemCard({ 
  food, 
  index, 
  onUpdate, 
  onUpdateNutrient, 
  onRemove 
}: { 
  food: FoodItem; 
  index: number; 
  onUpdate: (index: number, field: 'name' | 'quantity' | 'unit', value: string) => void;
  onUpdateNutrient: (index: number, field: keyof NutrientTotals, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <LinearGradient
      colors={['#ffffff', '#f8fafc']}
      style={styles.foodCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.foodCardHeader}>
        <View style={styles.foodCardTitle}>
          <View style={styles.foodBadge}>
            <Text style={styles.foodBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.foodCardName} numberOfLines={1}>
            {food.name}
          </Text>
        </View>
        <View style={styles.foodCardActions}>
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconButton}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
          </Pressable>
          <Pressable onPress={() => onRemove(index)} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View style={styles.foodCardPreview}>
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Quantity</Text>
          <Text style={styles.previewValue}>{food.quantity} {food.unit}</Text>
        </View>
        <View style={styles.previewDivider} />
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Calories</Text>
          <Text style={styles.previewValue}>{Math.round(food.nutrients.calories)}</Text>
        </View>
        <View style={styles.previewDivider} />
        <View style={styles.previewItem}>
          <Text style={styles.previewLabel}>Protein</Text>
          <Text style={styles.previewValue}>{Math.round(food.nutrients.protein)}g</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.foodCardExpanded}>
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Food name"
                value={food.name}
                onChangeText={(value) => onUpdate(index, 'name', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Quantity"
                keyboardType="decimal-pad"
                value={String(food.quantity)}
                onChangeText={(value) => onUpdate(index, 'quantity', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Unit"
                value={food.unit}
                onChangeText={(value) => onUpdate(index, 'unit', value)}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Macronutrients</Text>
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Calories"
                keyboardType="decimal-pad"
                value={String(food.nutrients.calories)}
                onChangeText={(value) => onUpdateNutrient(index, 'calories', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Protein (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.protein)}
                onChangeText={(value) => onUpdateNutrient(index, 'protein', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Carbs (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.carbs)}
                onChangeText={(value) => onUpdateNutrient(index, 'carbs', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Fats (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.fats)}
                onChangeText={(value) => onUpdateNutrient(index, 'fats', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Fiber (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.fiber)}
                onChangeText={(value) => onUpdateNutrient(index, 'fiber', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Sodium (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.sodium)}
                onChangeText={(value) => onUpdateNutrient(index, 'sodium', value)}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Micronutrients</Text>
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Potassium (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.potassium)}
                onChangeText={(value) => onUpdateNutrient(index, 'potassium', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Calcium (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.calcium)}
                onChangeText={(value) => onUpdateNutrient(index, 'calcium', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Iron (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.iron)}
                onChangeText={(value) => onUpdateNutrient(index, 'iron', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Vitamin C (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.vitaminC)}
                onChangeText={(value) => onUpdateNutrient(index, 'vitaminC', value)}
              />
            </View>
          </View>

          <Input
            label="Vitamin D (mcg)"
            keyboardType="decimal-pad"
            value={String(food.nutrients.vitaminD)}
            onChangeText={(value) => onUpdateNutrient(index, 'vitaminD', value)}
          />
        </View>
      )}
    </LinearGradient>
  );
}

export default function MealLoggerModal() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  const { meals, addMeal, editMeal, initialize, isLoading, isSaving } = useNutritionStore();
  const existingMeal = meals.find((entry) => entry.id === mealId);
  const [name, setName] = useState(existingMeal?.name ?? '');
  const [mealType, setMealType] = useState<MealType>(existingMeal?.mealType ?? 'breakfast');
  const [notes, setNotes] = useState(existingMeal?.notes ?? '');
  const [foods, setFoods] = useState<FoodItem[]>(
    (existingMeal?.foods.length ? existingMeal.foods : []).map((food) => ({
      ...food,
      id: food.id ?? createFoodId(),
    }))
  );

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!existingMeal) {
      return;
    }

    setName(existingMeal.name);
    setMealType(existingMeal.mealType);
    setNotes(existingMeal.notes ?? '');
    setFoods(
      (existingMeal.foods.length ? existingMeal.foods : []).map((food) => ({
        ...food,
        id: food.id ?? createFoodId(),
      }))
    );
  }, [existingMeal]);

  const totals = useMemo(
    () =>
      foods.reduce(
        (acc, food) => ({
          calories: acc.calories + food.nutrients.calories * food.quantity,
          protein: acc.protein + food.nutrients.protein * food.quantity,
          carbs: acc.carbs + food.nutrients.carbs * food.quantity,
          fats: acc.fats + food.nutrients.fats * food.quantity,
          fiber: acc.fiber + food.nutrients.fiber * food.quantity,
          sugar: acc.sugar + food.nutrients.sugar * food.quantity,
          sodium: acc.sodium + food.nutrients.sodium * food.quantity,
          potassium: acc.potassium + food.nutrients.potassium * food.quantity,
          calcium: acc.calcium + food.nutrients.calcium * food.quantity,
          iron: acc.iron + food.nutrients.iron * food.quantity,
          vitaminC: acc.vitaminC + food.nutrients.vitaminC * food.quantity,
          vitaminD: acc.vitaminD + food.nutrients.vitaminD * food.quantity,
        }),
        { ...emptyTotals }
      ),
    [foods]
  );

  function addFood(food: FoodItem) {
    setFoods((current) => [...current, { ...food, id: food.id ?? createFoodId() }]);
  }

  function removeFood(index: number) {
    Alert.alert('Remove food', `Remove "${foods[index].name}" from your meal?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setFoods((current) => current.filter((_, i) => i !== index));
      }},
    ]);
  }

  function updateFood(index: number, field: 'name' | 'quantity' | 'unit', value: string) {
    setFoods((current) =>
      current.map((food, foodIndex) => {
        if (foodIndex !== index) return food;
        if (field === 'quantity') return { ...food, quantity: Number(value) || 0 };
        return { ...food, [field]: value };
      })
    );
  }

  function updateNutrient(index: number, field: keyof NutrientTotals, value: string) {
    setFoods((current) =>
      current.map((food, foodIndex) =>
        foodIndex === index
          ? {
              ...food,
              nutrients: { ...food.nutrients, [field]: Number(value) || 0 },
            }
          : food
      )
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please give your meal a name.');
      return;
    }
    if (!foods.length) {
      Alert.alert('No food items', 'Add at least one food item to your meal.');
      return;
    }

    const invalidFood = foods.find((food) => !food.name.trim());
    if (invalidFood) {
      Alert.alert('Missing food name', 'Each food item needs a name before you can save the meal.');
      return;
    }

    try {
      const payload: MealPayload = {
        name: name.trim(),
        mealType,
        notes: notes.trim(),
        consumedAt: existingMeal?.consumedAt ?? new Date().toISOString(),
        foods: foods.map((food) => ({
          name: food.name.trim(),
          quantity: Number.isFinite(food.quantity) ? food.quantity : 0,
          unit: food.unit.trim() || 'serving',
          nutrients: food.nutrients,
        })),
      };

      if (existingMeal) {
        await editMeal(existingMeal.id, payload);
      } else {
        await addMeal(payload);
      }
      router.back();
    } catch (error) {
      Alert.alert('Could not save meal', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      {isLoading && !meals.length ? (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading meal data...</Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </Pressable>
          <Text style={styles.title}>{existingMeal ? 'Edit Meal' : 'Log Meal'}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Input label="Meal name" value={name} onChangeText={setName} placeholder="e.g., Post-Workout Meal" />
        </View>

        {/* Meal Type Selection */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Meal type</Text>
          <View style={styles.typeRow}>
            {mealTypes.map((type) => {
              const config = mealTypeConfig[type];
              const isActive = mealType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setMealType(type)}
                  style={[styles.typeChip, isActive && { backgroundColor: `${config.color}15`, borderColor: config.color }]}
                >
                  <Ionicons name={config.icon as any} size={16} color={isActive ? config.color : '#64748b'} />
                  <Text style={[styles.typeChipText, isActive && { color: config.color }]}>
                    {config.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Food Search */}
        <View style={styles.card}>
          <FoodSearch onSelect={addFood} />
          
          <Pressable
            style={styles.customButton}
            onPress={() =>
              addFood({
                name: 'Custom Food',
                quantity: 1,
                unit: 'serving',
                nutrients: { ...emptyTotals },
              })
            }
          >
            <Ionicons name="add-circle-outline" size={18} color="#0d9488" />
            <Text style={styles.customButtonText}>Add custom food</Text>
          </Pressable>
        </View>

        {/* Food Items List */}
        {foods.length > 0 && (
          <View style={styles.foodsSection}>
            <View style={styles.foodsHeader}>
              <Text style={styles.foodsTitle}>Food items</Text>
              <Text style={styles.foodsCount}>{foods.length} items</Text>
            </View>
            {foods.map((food, index) => (
              <FoodItemCard
                key={food.id ?? `${index}`}
                food={food}
                index={index}
                onUpdate={updateFood}
                onUpdateNutrient={updateNutrient}
                onRemove={removeFood}
              />
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={styles.card}>
          <Input 
            label="Notes" 
            value={notes} 
            onChangeText={setNotes} 
            multiline 
            numberOfLines={3}
            placeholder="Add any notes about this meal..."
          />
        </View>

        {/* Meal Totals */}
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>Meal totals</Text>
          <View style={styles.totalsGrid}>
            <View style={styles.totalsItem}>
              <Text style={styles.totalsValue}>{Math.round(totals.calories)}</Text>
              <Text style={styles.totalsLabel}>kcal</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsItem}>
              <Text style={styles.totalsValue}>{Math.round(totals.protein)}g</Text>
              <Text style={styles.totalsLabel}>Protein</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsItem}>
              <Text style={styles.totalsValue}>{Math.round(totals.carbs)}g</Text>
              <Text style={styles.totalsLabel}>Carbs</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsItem}>
              <Text style={styles.totalsValue}>{Math.round(totals.fats)}g</Text>
              <Text style={styles.totalsLabel}>Fats</Text>
            </View>
          </View>
          <View style={styles.totalsFooter}>
            <Ionicons name="leaf-outline" size={12} color="#5eead4" />
            <Text style={styles.totalsFooterText}>
              Fiber: {Math.round(totals.fiber)}g • Sugar: {Math.round(totals.sugar)}g
            </Text>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button 
            label={existingMeal ? 'Update Meal' : 'Save Meal'} 
            onPress={handleSave} 
            loading={isSaving} 
          />
          <Button label="Cancel" onPress={() => router.back()} tone="secondary" />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  customButtonText: {
    color: '#0d9488',
    fontSize: 14,
    fontWeight: '500',
  },
  foodsSection: {
    marginBottom: 16,
  },
  foodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  foodsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  foodsCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  foodCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  foodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
  },
  foodCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  foodBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0d9488',
  },
  foodCardName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  foodCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  foodCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 12,
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  previewDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  foodCardExpanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  inline: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineItem: {
    flex: 1,
  },
  totalsCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  totalsTitle: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalsItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalsValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  totalsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
  totalsDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  totalsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalsFooterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '400',
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  spacer: {
    height: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(248, 250, 252, 0.92)',
  },
  loadingText: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '600',
  },
});
