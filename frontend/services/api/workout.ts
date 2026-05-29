import { WorkoutAiReview, WorkoutCreatePayload, WorkoutPlan, WorkoutScheduleEntry, WorkoutTemplate } from '@/types/workout';
import { apiRequest } from './client';

export function fetchWorkoutPlans(accessToken: string) {
  return apiRequest<{ workouts: WorkoutPlan[] }>('/workouts', {
    accessToken,
  });
}

export function fetchWorkoutTemplates(accessToken: string) {
  return apiRequest<{ templates: WorkoutTemplate[] }>('/workouts/templates', {
    accessToken,
  });
}

export function getCurrentWorkout(accessToken: string) {
  return apiRequest<{ workout: WorkoutPlan; scheduleEntry: WorkoutScheduleEntry | null }>(
    '/workouts/current',
    {
      accessToken,
    }
  );
}

export function fetchWorkoutPlan(accessToken: string, id: string) {
  return apiRequest<{ workout: WorkoutPlan }>(`/workouts/${id}`, {
    accessToken,
  });
}

export function createWorkoutPlan(accessToken: string, payload: WorkoutCreatePayload) {
  return apiRequest<{ workout: WorkoutPlan }>('/workouts', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function updateWorkoutPlan(
  accessToken: string,
  id: string,
  payload: Partial<WorkoutCreatePayload> & { schedule?: WorkoutPlan['schedule'] }
) {
  return apiRequest<{ workout: WorkoutPlan }>(`/workouts/${id}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function reorderWorkoutExercises(accessToken: string, id: string, exercises: WorkoutPlan['exercises']) {
  return apiRequest<{ workout: WorkoutPlan }>(`/workouts/${id}/exercises`, {
    method: 'PUT',
    accessToken,
    body: { exercises },
  });
}

export function deleteWorkoutPlan(accessToken: string, id: string) {
  return apiRequest<{ message: string }>(`/workouts/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function scheduleWorkoutPlan(accessToken: string, id: string, scheduledDate: string) {
  return apiRequest<{ workout: WorkoutPlan }>(`/workouts/${id}/schedule`, {
    method: 'POST',
    accessToken,
    body: { scheduledDate },
  });
}

export function updateWeeklySchedule(accessToken: string, id: string, schedule: any[]) {
  return apiRequest<{ workout: WorkoutPlan }>(`/workouts/${id}/schedule`, {
    method: 'PUT',
    accessToken,
    body: { schedule },
  });
}

export function completeWorkout(accessToken: string, id: string, scheduleEntryId?: string) {
  return apiRequest<{ workout: WorkoutPlan }>(`/workouts/${id}/complete`, {
    method: 'POST',
    accessToken,
    body: scheduleEntryId ? { scheduleEntryId } : {},
  });
}

export function fetchWorkoutAiReview(accessToken: string, id: string) {
  return apiRequest<{ aiReview: WorkoutAiReview; missedWorkouts: WorkoutScheduleEntry[] }>(
    `/workouts/${id}/ai-review`,
    {
      accessToken,
    }
  );
}

export function refreshWorkoutAiReview(accessToken: string, id: string) {
  return apiRequest<{ aiReview: WorkoutAiReview; missedWorkouts: WorkoutScheduleEntry[] }>(
    `/workouts/${id}/ai-review`,
    {
      method: 'POST',
      accessToken,
    }
  );
}

export function createWorkoutFromTemplate(accessToken: string, templateKey: string, editable = true) {
  return apiRequest<{ workout: WorkoutPlan }>('/workouts/templates/use', {
    method: 'POST',
    accessToken,
    body: { templateKey, editable },
  });
}
