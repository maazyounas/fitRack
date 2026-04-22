import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FoodItem } from '@/types/nutrition';

const presets: (Omit<FoodItem, 'id' | 'quantity'> & { quantity?: number })[] = [
  {
    name: 'Greek Yogurt Bowl',
    unit: 'bowl',
    nutrients: {
      calories: 190,
      protein: 18,
      carbs: 14,
      fats: 5,
      fiber: 2,
      sugar: 9,
      sodium: 65,
      potassium: 240,
      calcium: 220,
      iron: 0.3,
      vitaminC: 2,
      vitaminD: 1,
    },
  },
  {
    name: 'Grilled Chicken Breast',
    unit: 'serving',
    nutrients: {
      calories: 220,
      protein: 38,
      carbs: 0,
      fats: 5,
      fiber: 0,
      sugar: 0,
      sodium: 110,
      potassium: 320,
      calcium: 15,
      iron: 1,
      vitaminC: 0,
      vitaminD: 0,
    },
  },
  {
    name: 'Quinoa Salad',
    unit: 'bowl',
    nutrients: {
      calories: 310,
      protein: 11,
      carbs: 44,
      fats: 10,
      fiber: 7,
      sugar: 5,
      sodium: 180,
      potassium: 410,
      calcium: 60,
      iron: 2.8,
      vitaminC: 16,
      vitaminD: 0,
    },
  },
  {
    name: 'Salmon Fillet',
    unit: 'fillet',
    nutrients: {
      calories: 280,
      protein: 32,
      carbs: 0,
      fats: 16,
      fiber: 0,
      sugar: 0,
      sodium: 90,
      potassium: 480,
      calcium: 20,
      iron: 0.8,
      vitaminC: 0,
      vitaminD: 10,
    },
  },
  {
    name: 'Oatmeal with Berries',
    unit: 'bowl',
    nutrients: {
      calories: 265,
      protein: 9,
      carbs: 44,
      fats: 6,
      fiber: 8,
      sugar: 11,
      sodium: 85,
      potassium: 290,
      calcium: 120,
      iron: 2.1,
      vitaminC: 18,
      vitaminD: 2,
    },
  },
];

export function FoodSearch({ onSelect }: { onSelect: (food: FoodItem) => void }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return presets;
    }

    return presets.filter((preset) => preset.name.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Food search</Text>
      <TextInput
        placeholder="Search common foods"
        placeholderTextColor="#64748b"
        style={styles.input}
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.results}>
        {filtered.map((preset) => (
          <Pressable
            key={preset.name}
            onPress={() =>
              onSelect({
                name: preset.name,
                quantity: 1,
                unit: preset.unit,
                nutrients: preset.nutrients,
              })
            }
            style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
          >
            <Text style={styles.cardTitle}>{preset.name}</Text>
            <Text style={styles.cardMeta}>
              {preset.nutrients.calories} kcal • P {preset.nutrients.protein}g
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  label: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  results: {
    gap: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 180,
    padding: 14,
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardMeta: {
    color: '#475569',
    fontSize: 12,
  },
});
