import React, { useState } from 'react';
import { StyleSheet, Modal, View } from 'react-native';
import { Exercise } from '@/types/exercise';
import { ExerciseLibrary } from '@/components/exercises/ExerciseLibrary';
import { ExerciseDetail } from '@/components/exercises/ExerciseDetail';
import { useAppPalette } from '@/hooks/useAppPalette';

export default function ExercisesScreen() {
  const palette = useAppPalette();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseDetail = () => {
    setSelectedExercise(null);
  };

  const handleAddToWorkout = () => {
    if (selectedExercise) {
      // This would integrate with workout creation
      // For now, just close the detail view
      handleCloseDetail();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ExerciseLibrary
        onSelectExercise={handleSelectExercise}
        selectedMuscleGroup={selectedMuscleGroup || undefined}
        onMuscleGroupChange={setSelectedMuscleGroup}
      />

      <Modal
        visible={selectedExercise !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseDetail}>
        {selectedExercise && (
          <ExerciseDetail
            exercise={selectedExercise}
            onClose={handleCloseDetail}
            onAddToWorkout={handleAddToWorkout}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
