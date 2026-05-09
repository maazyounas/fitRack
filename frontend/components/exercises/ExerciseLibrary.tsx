import React, { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, ExerciseFilters } from '@/types/exercise';
import { useAuthStore } from '@/store/authStore';
import { fetchExercises, fetchExerciseFilters } from '@/services/api/exercise';
import { useAppPalette } from '@/hooks/useAppPalette';
import { ExerciseCard } from './ExerciseCard';

interface ExerciseLibraryProps {
  onSelectExercise: (exercise: Exercise) => void;
  selectedMuscleGroup?: string;
  onMuscleGroupChange?: (group: string | null) => void;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({
  onSelectExercise,
  selectedMuscleGroup,
  onMuscleGroupChange,
}) => {
  const palette = useAppPalette();
  const { tokens } = useAuthStore();
  const accessToken = tokens?.accessToken;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filters, setFilters] = useState<ExerciseFilters | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadExercises = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const data = await fetchExercises(accessToken, {
        muscleGroup: selectedMuscleGroup || undefined,
        difficulty: selectedDifficulty as any,
        equipment: selectedEquipment || undefined,
        search: searchText || undefined,
      });
      setExercises(data.exercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFilters = async () => {
    if (!accessToken) return;

    try {
      const data = await fetchExerciseFilters(accessToken);
      setFilters(data.filters);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  useEffect(() => {
    void loadFilters();
  }, [accessToken]);

  useEffect(() => {
    void loadExercises();
  }, [selectedMuscleGroup, selectedDifficulty, selectedEquipment, searchText, accessToken]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExercises();
    setRefreshing(false);
  };

  const muscleGroups = useMemo(() => {
    if (!filters) return [];
    return filters.muscleGroups.sort();
  }, [filters]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: palette.card }]}>
        <Ionicons name="search" size={20} color={palette.mutedText} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          placeholder="Search exercises..."
          placeholderTextColor={palette.mutedText}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <Pressable onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={palette.mutedText} />
          </Pressable>
        ) : null}
      </View>

      {/* Muscle Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}>
        <Pressable
          onPress={() => onMuscleGroupChange?.(null)}
          style={[
            styles.filterChip,
            !selectedMuscleGroup && { backgroundColor: palette.tint },
          ]}>
          <Text
            style={[
              styles.filterChipText,
              !selectedMuscleGroup && { color: palette.background },
            ]}>
            All
          </Text>
        </Pressable>
        {muscleGroups.map((group) => (
          <Pressable
            key={group}
            onPress={() => onMuscleGroupChange?.(group)}
            style={[
              styles.filterChip,
              { backgroundColor: palette.card },
              selectedMuscleGroup === group && { backgroundColor: palette.tint },
            ]}>
            <Text
              style={[
                styles.filterChipText,
                { color: palette.text },
                selectedMuscleGroup === group && { color: palette.background },
              ]}>
              {group}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Difficulty and Equipment Filters */}
      <View style={styles.secondaryFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters?.difficulties.map((difficulty) => (
            <Pressable
              key={difficulty}
              onPress={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
              style={[
                styles.smallFilterChip,
                selectedDifficulty === difficulty && { backgroundColor: palette.tint },
              ]}>
              <Text
                style={[
                  styles.smallFilterText,
                  selectedDifficulty === difficulty && { color: palette.background },
                ]}>
                {difficulty}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={palette.tint} />
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard exercise={item} onPress={() => onSelectExercise(item)} />
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={palette.mutedText} />
              <Text style={[styles.emptyText, { color: palette.text }]}>No exercises found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryFilters: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  smallFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  smallFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});
