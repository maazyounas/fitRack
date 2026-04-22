import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutBuilder } from '@/components/workouts/WorkoutBuilder';
import { useWorkoutStore } from '@/store/workoutStore';

export default function WorkoutBuilderModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();
  const { plans, createPlan, updatePlan, isLoading } = useWorkoutStore();
  const selectedPlan = plans.find((plan) => plan.id === params.planId) ?? null;

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
          router.back();
        } catch (error) {
          Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
        }
      }}
      saving={isLoading}
    />
  );
}
