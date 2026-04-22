import { apiRequest } from './client';
import {
  HydrationReminder,
  MealEntry,
  MealPayload,
  NutritionDashboard,
  NutritionGoals,
  NutritionRecommendation,
  WaterLog,
} from '@/types/nutrition';

export async function fetchNutritionDashboard(accessToken: string) {
  return apiRequest<NutritionDashboard>('/nutrition', { accessToken });
}

export async function createMeal(accessToken: string, payload: MealPayload) {
  const response = await apiRequest<{ meal: MealEntry }>('/nutrition/meals', {
    method: 'POST',
    accessToken,
    body: payload,
  });

  return response.meal;
}

export async function updateMeal(accessToken: string, mealId: string, payload: MealPayload) {
  const response = await apiRequest<{ meal: MealEntry }>(`/nutrition/meals/${mealId}`, {
    method: 'PATCH',
    accessToken,
    body: payload,
  });

  return response.meal;
}

export async function logWater(accessToken: string, payload: { amountMl: number; loggedAt?: string }) {
  const response = await apiRequest<{ waterLog: WaterLog }>('/nutrition/water', {
    method: 'POST',
    accessToken,
    body: payload,
  });

  return response.waterLog;
}

export async function updateNutritionGoals(
  accessToken: string,
  payload: {
    goals?: Partial<NutritionGoals>;
    hydrationReminder?: Partial<HydrationReminder>;
  }
) {
  return apiRequest<{ goals: NutritionGoals; hydrationReminder: HydrationReminder }>('/nutrition/goals', {
    method: 'PATCH',
    accessToken,
    body: payload,
  });
}

export async function fetchNutritionRecommendations(accessToken: string) {
  const response = await apiRequest<{ recommendations: NutritionRecommendation[] }>(
    '/nutrition/recommendations',
    { accessToken }
  );

  return response.recommendations;
}
