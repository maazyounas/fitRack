import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WorkoutExecutionScreen } from '@/components/workouts/WorkoutExecutionScreen';

export default function WorkoutExecutionModal() {
  const { workoutId } = useLocalSearchParams<{ workoutId?: string }>();
  
  if (!workoutId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No workout selected</Text>
      </View>
    );
  }

  return <WorkoutExecutionScreen workoutId={workoutId} />;
}
