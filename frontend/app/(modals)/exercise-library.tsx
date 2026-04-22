import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { fetchExerciseFilters, fetchExercises } from '@/services/api/exercise';
import { Exercise, ExerciseDifficulty, ExerciseFilters } from '@/types/exercise';
import { useAuthStore } from '@/store/authStore';

const allLabel = 'All';

export default function ExerciseLibraryModal() {
  const router = useRouter();
  const { tokens, user } = useAuthStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filters, setFilters] = useState<ExerciseFilters>({
    muscleGroups: [],
    difficulties: ['beginner', 'intermediate', 'advanced'],
    equipment: [],
  });
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ExerciseDifficulty | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadFilters = useCallback(async () => {
    if (!tokens?.accessToken) {
      return;
    }

    const response = await fetchExerciseFilters(tokens.accessToken);
    setFilters(response.filters);
  }, [tokens?.accessToken]);

  const loadExercises = useCallback(async () => {
    if (!tokens?.accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchExercises(tokens.accessToken, {
        muscleGroup: selectedMuscleGroup || undefined,
        difficulty: selectedDifficulty || undefined,
        equipment: selectedEquipment || undefined,
        search: search.trim() || undefined,
      });
      setExercises(response.exercises);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedDifficulty, selectedEquipment, selectedMuscleGroup, tokens?.accessToken]);

  useEffect(() => {
    void loadFilters().catch((error) =>
      Alert.alert('Exercise filters failed', error instanceof Error ? error.message : 'Please try again.')
    );
  }, [loadFilters]);

  useFocusEffect(
    useCallback(() => {
      void loadExercises().catch((error) =>
        Alert.alert('Exercise library failed', error instanceof Error ? error.message : 'Please try again.')
      );
    }, [loadExercises])
  );

  const activeFilters = useMemo(
    () => [selectedMuscleGroup, selectedDifficulty, selectedEquipment].filter(Boolean).length,
    [selectedDifficulty, selectedEquipment, selectedMuscleGroup]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Exercise Library</Text>
          <Text style={styles.subtitle}>
            Search by muscle group, difficulty, and equipment to find the right movement fast.
          </Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons color="#0f172a" name="close" size={22} />
        </Pressable>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Ionicons color="#64748b" name="search" size={18} />
          <TextInput
            onChangeText={setSearch}
            placeholder="Search exercises, muscles, or keywords"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
          />
        </View>
        <Button label="Apply Search" onPress={() => void loadExercises()} tone="secondary" />
      </View>

      <FilterSection
        label={`Muscle Group${activeFilters ? ` (${activeFilters} active filters)` : ''}`}
        options={[allLabel, ...filters.muscleGroups]}
        selected={selectedMuscleGroup || allLabel}
        onSelect={(value) => setSelectedMuscleGroup(value === allLabel ? '' : value)}
      />
      <FilterSection
        label="Difficulty"
        options={[allLabel, ...filters.difficulties]}
        selected={selectedDifficulty || allLabel}
        onSelect={(value) => setSelectedDifficulty(value === allLabel ? '' : (value as ExerciseDifficulty))}
      />
      <FilterSection
        label="Equipment"
        options={[allLabel, ...filters.equipment]}
        selected={selectedEquipment || allLabel}
        onSelect={(value) => setSelectedEquipment(value === allLabel ? '' : value)}
      />

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {user?.isAdmin ? (
          <Button
            label="Add Exercise"
            onPress={() => router.push('/(modals)/exercise/new' as never)}
            tone="primary"
          />
        ) : null}
      </View>

      {isLoading ? <Text style={styles.emptyText}>Loading exercise library...</Text> : null}

      {!isLoading && !exercises.length ? (
        <Text style={styles.emptyText}>No exercises matched your current filters.</Text>
      ) : null}

      {exercises.map((exercise) => (
        <Pressable
          key={exercise.id}
          onPress={() => router.push(`/(modals)/exercise/${exercise.id}` as never)}
          style={styles.exerciseCard}
        >
          <View style={styles.exerciseTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>
                {exercise.muscleGroup} | {exercise.difficulty} | {exercise.equipment}
              </Text>
            </View>
            {exercise.isFavorite ? <Ionicons color="#dc2626" name="heart" size={20} /> : null}
          </View>
          <Text numberOfLines={2} style={styles.exerciseDescription}>
            {exercise.description}
          </Text>
          <View style={styles.badgeRow}>
            {exercise.targetMuscles.slice(0, 3).map((muscle) => (
              <View key={muscle} style={styles.badge}>
                <Text style={styles.badgeText}>{muscle}</Text>
              </View>
            ))}
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              {exercise.ratingAverage.toFixed(1)} stars ({exercise.ratingCount})
            </Text>
            <Text style={styles.statText}>{exercise.favoriteCount} favorites</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function FilterSection({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {options.map((option) => {
            const isActive = option === selected;
            return (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
              >
                <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    padding: 20,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 12,
    marginBottom: 18,
    padding: 16,
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: '#0f172a',
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  filterSection: {
    marginBottom: 14,
  },
  filterLabel: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#f8fafc',
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginBottom: 14,
    padding: 16,
  },
  exerciseTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  exerciseName: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
  },
  exerciseMeta: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  exerciseDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    backgroundColor: '#ecfeff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  statText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
