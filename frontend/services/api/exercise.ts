import { Exercise, ExerciseFilters, ExercisePayload, ExerciseQuery } from '@/types/exercise';
import { apiRequest } from './client';

function toQueryString(query: ExerciseQuery = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function fetchExercises(accessToken: string, query?: ExerciseQuery) {
  return apiRequest<{ exercises: Exercise[] }>(`/exercises${toQueryString(query)}`, {
    accessToken,
  });
}

export function fetchExerciseFilters(accessToken: string) {
  return apiRequest<{ filters: ExerciseFilters }>('/exercises/filters', {
    accessToken,
  });
}

export function fetchExercise(accessToken: string, id: string) {
  return apiRequest<{ exercise: Exercise }>(`/exercises/${id}`, {
    accessToken,
  });
}

export function setExerciseFavorite(accessToken: string, id: string, isFavorite: boolean) {
  return apiRequest<{ exercise: Exercise }>(`/exercises/${id}/favorite`, {
    method: 'PATCH',
    accessToken,
    body: { isFavorite },
  });
}

export function rateExercise(accessToken: string, id: string, score: number) {
  return apiRequest<{ exercise: Exercise }>(`/exercises/${id}/rating`, {
    method: 'POST',
    accessToken,
    body: { score },
  });
}

export function saveExerciseNotes(accessToken: string, id: string, content: string) {
  return apiRequest<{ exercise: Exercise }>(`/exercises/${id}/notes`, {
    method: 'PATCH',
    accessToken,
    body: { content },
  });
}

export function addExerciseComment(accessToken: string, id: string, content: string) {
  return apiRequest<{ exercise: Exercise }>(`/exercises/${id}/comments`, {
    method: 'POST',
    accessToken,
    body: { content },
  });
}

export function createExercise(accessToken: string, payload: ExercisePayload) {
  return apiRequest<{ exercise: Exercise }>('/exercises', {
    method: 'POST',
    accessToken,
    body: payload,
  });
}

export function updateExercise(accessToken: string, id: string, payload: ExercisePayload) {
  return apiRequest<{ exercise: Exercise }>(`/exercises/${id}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export function deleteExercise(accessToken: string, id: string) {
  return apiRequest<{ message: string }>(`/exercises/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}
