import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function MealLoggerModal() {
  const router = useRouter();
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  const { meals, addMeal, editMeal, isSaving } = useNutritionStore();
  const existingMeal = meals.find((entry) => entry.id === mealId);
  const [name, setName] = useState(existingMeal?.name ?? '');
  const [mealType, setMealType] = useState<MealType>(existingMeal?.mealType ?? 'breakfast');
  const [notes, setNotes] = useState(existingMeal?.notes ?? '');
  const [foods, setFoods] = useState<FoodItem[]>(existingMeal?.foods.length ? existingMeal.foods : []);

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
    setFoods((current) => [...current, food]);
  }

  function updateFood(index: number, field: 'name' | 'quantity' | 'unit', value: string) {
    setFoods((current) =>
      current.map((food, foodIndex) => {
        if (foodIndex !== index) {
          return food;
        }

        if (field === 'quantity') {
          return { ...food, quantity: Number(value) || 0 };
        }

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
              nutrients: {
                ...food.nutrients,
                [field]: Number(value) || 0,
              },
            }
          : food
      )
    );
  }

  async function handleSave() {
    if (!name.trim() || !foods.length) {
      Alert.alert('Meal details missing', 'Add a meal name and at least one food item.');
      return;
    }

    const payload: MealPayload = {
      name: name.trim(),
      mealType,
      notes: notes.trim(),
      consumedAt: existingMeal?.consumedAt ?? new Date().toISOString(),
      foods: foods.map((food) => ({
        name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        nutrients: food.nutrients,
      })),
    };

    if (existingMeal) {
      await editMeal(existingMeal.id, payload);
    } else {
      await addMeal(payload);
    }

    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{existingMeal ? 'Edit Meal Entry' : 'Meal Logger'}</Text>
      <Text style={styles.subtitle}>Track calories, macros, and key micronutrients for each food item.</Text>

      <Input label="Meal name" value={name} onChangeText={setName} />

      <View style={styles.typeRow}>
        {mealTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setMealType(type)}
            style={[styles.typeChip, mealType === type ? styles.typeChipActive : null]}
          >
            <Text style={[styles.typeChipText, mealType === type ? styles.typeChipTextActive : null]}>{type}</Text>
          </Pressable>
        ))}
      </View>

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
        <Text style={styles.customButtonText}>Add Custom Food</Text>
      </Pressable>

      {foods.map((food, index) => (
        <View key={`${food.name}-${index}`} style={styles.foodCard}>
          <Input label="Food" value={food.name} onChangeText={(value) => updateFood(index, 'name', value)} />
          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Quantity"
                keyboardType="decimal-pad"
                value={String(food.quantity)}
                onChangeText={(value) => updateFood(index, 'quantity', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input label="Unit" value={food.unit} onChangeText={(value) => updateFood(index, 'unit', value)} />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Calories"
                keyboardType="decimal-pad"
                value={String(food.nutrients.calories)}
                onChangeText={(value) => updateNutrient(index, 'calories', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Protein (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.protein)}
                onChangeText={(value) => updateNutrient(index, 'protein', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Carbs (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.carbs)}
                onChangeText={(value) => updateNutrient(index, 'carbs', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Fats (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.fats)}
                onChangeText={(value) => updateNutrient(index, 'fats', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Fiber (g)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.fiber)}
                onChangeText={(value) => updateNutrient(index, 'fiber', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Sodium (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.sodium)}
                onChangeText={(value) => updateNutrient(index, 'sodium', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Potassium (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.potassium)}
                onChangeText={(value) => updateNutrient(index, 'potassium', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Calcium (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.calcium)}
                onChangeText={(value) => updateNutrient(index, 'calcium', value)}
              />
            </View>
          </View>

          <View style={styles.inline}>
            <View style={styles.inlineItem}>
              <Input
                label="Iron (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.iron)}
                onChangeText={(value) => updateNutrient(index, 'iron', value)}
              />
            </View>
            <View style={styles.inlineItem}>
              <Input
                label="Vitamin C (mg)"
                keyboardType="decimal-pad"
                value={String(food.nutrients.vitaminC)}
                onChangeText={(value) => updateNutrient(index, 'vitaminC', value)}
              />
            </View>
          </View>

          <Input
            label="Vitamin D (mcg)"
            keyboardType="decimal-pad"
            value={String(food.nutrients.vitaminD)}
            onChangeText={(value) => updateNutrient(index, 'vitaminD', value)}
          />
        </View>
      ))}

      <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

      <View style={styles.totalsCard}>
        <Text style={styles.totalsTitle}>Meal totals</Text>
        <Text style={styles.totalsText}>
          {Math.round(totals.calories)} kcal • P {Math.round(totals.protein)}g • C {Math.round(totals.carbs)}g • F{' '}
          {Math.round(totals.fats)}g
        </Text>
      </View>

      <Button label={existingMeal ? 'Update Meal' : 'Save Meal'} onPress={handleSave} loading={isSaving} />
      <View style={styles.spacer} />
      <Button label="Close" onPress={() => router.back()} tone="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  typeChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeChipActive: {
    backgroundColor: '#0f766e',
  },
  typeChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  typeChipTextActive: {
    color: '#f8fafc',
  },
  customButton: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    borderRadius: 14,
    marginBottom: 16,
    padding: 14,
  },
  customButtonText: {
    color: '#155e75',
    fontSize: 14,
    fontWeight: '700',
  },
  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
  },
  inline: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineItem: {
    flex: 1,
  },
  totalsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
  },
  totalsTitle: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  totalsText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: {
    height: 12,
  },
});
