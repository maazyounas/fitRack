import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutBuilder } from '@/components/workouts/WorkoutBuilder';
import { useWorkoutStore } from '@/store/workoutStore';

export default function WorkoutBuilderModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();
  const { plans, createPlan, updatePlan, initialize, isLoading } = useWorkoutStore();

  useEffect(() => {
    if (params.planId && plans.length === 0) {
      void initialize();
    }
  }, [initialize, params.planId, plans.length]);

  const selectedPlan = plans.find((plan) => plan.id === params.planId) ?? null;

  const closeModal = () => {
    if (Platform.OS === 'web') {
      router.replace('/workouts');
      return;
    }

    router.back();
  };

  return (
    <WorkoutBuilder
      initialPlan={selectedPlan}
      onSave={async (payload, planId) => {
        try {
          if (planId) {
            await updatePlan(planId, payload);
          } else {
            await createPlan(payload);
          }
          closeModal();
        } catch (error) {
          Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
        }
      }}
      saving={isLoading}
    />
  );
}
