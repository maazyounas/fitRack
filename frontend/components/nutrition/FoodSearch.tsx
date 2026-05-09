import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '@/types/nutrition';
import foodDb from '../../assets/data/foodDb.json';

export function FoodSearch({ onSelect }: { onSelect: (food: FoodItem) => void }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return foodDb.slice(0, 10);
    }

    return foodDb.filter((preset) => preset.name.toLowerCase().includes(normalized)).slice(0, 15);
  }, [query]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Food search</Text>
        <Pressable 
          onPress={() => Alert.alert('Coming Soon', 'Barcode scanning will be available in a future update!')}
          style={styles.barcodeBtn}
        >
          <Ionicons name="barcode-outline" size={18} color="#0f766e" />
          <Text style={styles.barcodeText}>Scan Barcode</Text>
        </Pressable>
      </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barcodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  barcodeText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
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
