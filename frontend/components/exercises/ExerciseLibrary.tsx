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
import { LinearGradient } from 'expo-linear-gradient';
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

  const difficulties = useMemo(() => {
    if (!filters) return [];
    return filters.difficulties;
  }, [filters]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: palette.card }]}>
        <Ionicons name="search-outline" size={20} color={palette.mutedText} />
        <TextInput
          style={[styles.searchInput, { color: palette.text }]}
          placeholder="Search exercises..."
          placeholderTextColor={palette.mutedText}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText ? (
          <Pressable onPress={() => setSearchText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={palette.mutedText} />
          </Pressable>
        ) : null}
      </View>

      {/* Muscle Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterSection}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          onPress={() => onMuscleGroupChange?.(null)}
          style={[
            styles.filterPill,
            !selectedMuscleGroup && styles.filterPillActive,
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              !selectedMuscleGroup && styles.filterPillTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {muscleGroups.map((group) => (
          <Pressable
            key={group}
            onPress={() => onMuscleGroupChange?.(group)}
            style={[
              styles.filterPill,
              selectedMuscleGroup === group && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedMuscleGroup === group && styles.filterPillTextActive,
              ]}
            >
              {group}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Difficulty Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.difficultySection}
        contentContainerStyle={styles.filterContent}
      >
        {difficulties.map((difficulty) => {
          const getDifficultyStyle = () => {
            switch (difficulty) {
              case 'beginner': return { bg: '#10b981', text: '#ffffff' };
              case 'intermediate': return { bg: '#f59e0b', text: '#ffffff' };
              case 'advanced': return { bg: '#ef4444', text: '#ffffff' };
              default: return { bg: '#64748b', text: '#ffffff' };
            }
          };
          const style = getDifficultyStyle();
          const isActive = selectedDifficulty === difficulty;
          
          return (
            <Pressable
              key={difficulty}
              onPress={() => setSelectedDifficulty(isActive ? null : difficulty)}
              style={[
                styles.difficultyPill,
                isActive && { backgroundColor: style.bg },
                !isActive && { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border },
              ]}
            >
              <Text
                style={[
                  styles.difficultyPillText,
                  isActive && { color: style.text },
                  !isActive && { color: palette.text },
                ]}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Results Count */}
      {!isLoading && exercises.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsText, { color: palette.mutedText }]}>
            {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} found
          </Text>
        </View>
      )}

      {/* Exercise List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={[styles.loaderText, { color: palette.mutedText }]}>Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard 
              exercise={item} 
              onPress={() => onSelectExercise(item)}
              showFavoriteButton
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0d9488" />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.emptyStateContent}>
                <Ionicons name="barbell-outline" size={56} color="#cbd5e1" />
                <Text style={[styles.emptyStateTitle, { color: palette.text }]}>No exercises found</Text>
                <Text style={[styles.emptyStateSubtitle, { color: palette.mutedText }]}>
                  Try adjusting your search or filters
                </Text>
              </LinearGradient>
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: 6,
  },
  filterSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  difficultySection: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 6,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  difficultyPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  difficultyPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
  },
  emptyStateSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
});