import { useWorkoutStore } from '@/store/workoutStore';

export function useWorkout() {
  return useWorkoutStore();
}
