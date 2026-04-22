type WorkoutExercise = {
  name: string;
  sets: number;
  reps: number;
  intensity: 'low' | 'moderate' | 'high';
};

type WorkoutPlanForAi = {
  name: string;
  updatedAt: Date;
  exercises: WorkoutExercise[];
  schedule: Array<{
    completed: boolean;
    scheduledDate: Date;
  }>;
};

export function analyzeWorkoutPlan(plan: WorkoutPlanForAi) {
  const completedSessions = plan.schedule.filter((session) => session.completed).length;
  const plannedSessions = plan.schedule.length || 1;
  const completionRate = completedSessions / plannedSessions;
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(plan.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const shouldIncreaseIntensity = completionRate > 0.75 && completedSessions >= 3;
  const shouldReduceIntensity = completionRate < 0.4 && plannedSessions >= 3;
  const outdated = daysSinceUpdate > 28;

  const intensityAdjustment = shouldIncreaseIntensity
    ? 'Increase resistance or reps by 5-10% next week.'
    : shouldReduceIntensity
      ? 'Reduce volume slightly and add a recovery day.'
      : 'Keep current intensity and focus on consistency.';

  const exerciseVariations = plan.exercises.slice(0, 3).map((exercise) => ({
    exerciseName: exercise.name,
    suggestion:
      exercise.intensity === 'high'
        ? `Swap ${exercise.name} with a tempo variation for joint recovery.`
        : `Progress ${exercise.name} with an added set or unilateral variant.`,
  }));

  return {
    completionRate,
    outdated,
    intensityAdjustment,
    exerciseVariations,
    outdatedReason: outdated
      ? `Plan has not been refreshed in ${daysSinceUpdate} days.`
      : 'Plan is still current.',
  };
}
