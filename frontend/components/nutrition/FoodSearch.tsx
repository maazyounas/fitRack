import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '@/types/nutrition';
import foodDb from '../../assets/data/foodDb.json';

export function FoodSearch({ onSelect }: { onSelect: (food: FoodItem) => void }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return foodDb.slice(0, 8);
    }
    return foodDb.filter((preset) => preset.name.toLowerCase().includes(normalized)).slice(0, 12);
  }, [query]);

  const getCalorieColor = (calories: number) => {
    if (calories < 100) return '#10b981';
    if (calories < 300) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Add food</Text>
        <Pressable 
          onPress={() => Alert.alert('Coming soon', 'Barcode scanning will be available in a future update!')}
          style={styles.barcodeBtn}
        >
          <Ionicons name="scan-outline" size={18} color="#0d9488" />
          <Text style={styles.barcodeText}>Scan</Text>
        </Pressable>
      </View>

      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        <Ionicons name="search-outline" size={20} color="#94a3b8" />
        <TextInput
          placeholder="Search foods..."
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.results}
      >
        {filtered.map((preset) => {
          const calorieColor = getCalorieColor(preset.nutrients.calories);
          
          return (
            <Pressable
              key={preset.name}
              onPress={() =>
                onSelect({
                  name: preset.name,
                  quantity: 1,
                  unit: preset.unit,
                  nutrients: {
                    ...preset.nutrients,
                    sugar: (preset.nutrients as any).sugar || 0,
                    sodium: (preset.nutrients as any).sodium || 0,
                    potassium: (preset.nutrients as any).potassium || 0,
                    calcium: (preset.nutrients as any).calcium || 0,
                    iron: (preset.nutrients as any).iron || 0,
                    vitaminC: (preset.nutrients as any).vitaminC || 0,
                    vitaminD: (preset.nutrients as any).vitaminD || 0,
                  },
                })
              }
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardTitle}>{preset.name}</Text>
              <View style={styles.cardFooter}>
                <View style={[styles.calorieBadge, { backgroundColor: `${calorieColor}15` }]}>
                  <Text style={[styles.calorieText, { color: calorieColor }]}>
                    {preset.nutrients.calories} kcal
                  </Text>
                </View>
                <View style={styles.macroPills}>
                  <Text style={styles.macroPill}>P {preset.nutrients.protein}g</Text>
                  <Text style={styles.macroPill}>C {preset.nutrients.carbs}g</Text>
                  <Text style={styles.macroPill}>F {preset.nutrients.fats}g</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  label: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  barcodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  barcodeText: {
    color: '#0d9488',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputContainerFocused: {
    borderColor: '#0d9488',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1e293b',
  },
  results: {
    gap: 12,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardTitle: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardFooter: {
    gap: 8,
  },
  calorieBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '600',
  },
  macroPills: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
  },
});