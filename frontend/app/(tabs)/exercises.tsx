import React, { useState, useRef } from 'react';
import { StyleSheet, Modal, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '@/types/exercise';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';
import { ExerciseDetail } from '@/components/exercises/ExerciseDetail';
import { useAppPalette } from '@/hooks/useAppPalette';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ExercisesScreen() {
  const palette = useAppPalette();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const handleCloseDetail = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedExercise(null);
      setIsModalVisible(false);
    });
  };

  const handleAddToWorkout = () => {
    if (selectedExercise) {
      // Show success feedback before closing
      handleCloseDetail();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {/* Header */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Exercise Library</Text>
          <Text style={styles.headerSubtitle}>
            Browse {selectedMuscleGroup ? selectedMuscleGroup : 'all'} exercises
          </Text>
        </View>
        {selectedMuscleGroup && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSelectedMuscleGroup(null)}
          >
            <Ionicons name="close-circle" size={20} color="#0d9488" />
            <Text style={styles.clearButtonText}>Clear filter</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Exercise Library */}
      <ExerciseLibrary
        onSelectExercise={handleSelectExercise}
        selectedMuscleGroup={selectedMuscleGroup || undefined}
        onMuscleGroupChange={setSelectedMuscleGroup}
      />

      {/* Modal with Animation */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseDetail}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseDetail}
          />
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
                backgroundColor: palette.background,
              }
            ]}
          >
            {/* Modal Handle Bar */}
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={handleCloseDetail}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>

            {selectedExercise && (
              <ExerciseDetail
                exercise={selectedExercise}
                onClose={handleCloseDetail}
                onAddToWorkout={handleAddToWorkout}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0d9488',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});