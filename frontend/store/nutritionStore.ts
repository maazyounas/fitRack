import { create } from 'zustand';
import {
  createMeal,
  fetchNutritionDashboard,
  fetchNutritionRecommendations,
  logWater,
  updateMeal,
  updateNutritionGoals,
} from '@/services/api/nutrition';
import {
  DailyNutritionReport,
  HydrationReminder,
  MealEntry,
  MealPayload,
  NutritionGoals,
  NutritionRecommendation,
  TrendPoint,
  WaterLog,
} from '@/types/nutrition';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';
import { useWorkoutStore } from './workoutStore';

const emptyTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  potassium: 0,
  calcium: 0,
  iron: 0,
  vitaminC: 0,
  vitaminD: 0,
};

const defaultGoals: NutritionGoals = {
  calories: 2200,
  protein: 140,
  carbs: 220,
  fats: 70,
  fiber: 30,
  waterMl: 2500,
};

const defaultReminder: HydrationReminder = {
  enabled: false,
  intervalMinutes: 120,
  startHour: 8,
  endHour: 21,
};

const emptyDaily: DailyNutritionReport = {
  date: new Date().toISOString(),
  totals: emptyTotals,
  waterConsumedMl: 0,
  mealsLogged: 0,
};

type NutritionState = {
  meals: MealEntry[];
  waterLogs: WaterLog[];
  recommendations: NutritionRecommendation[];
  goals: NutritionGoals;
  hydrationReminder: HydrationReminder;
  dailyReport: DailyNutritionReport;
  weeklyTrend: TrendPoint[];
  monthlyTrend: TrendPoint[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  addMeal: (payload: MealPayload) => Promise<void>;
  editMeal: (mealId: string, payload: MealPayload) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>;
  saveGoals: (payload: {
    goals?: Partial<NutritionGoals>;
    hydrationReminder?: Partial<HydrationReminder>;
  }) => Promise<void>;
};

function requireAccessToken() {
  const accessToken = useAuthStore.getState().tokens?.accessToken;
  if (!accessToken) {
    throw new Error('You need to log in first.');
  }
  return accessToken;
}

function sortByDateDesc<T extends { consumedAt?: string; loggedAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDate = left.consumedAt ?? left.loggedAt ?? '';
    const rightDate = right.consumedAt ?? right.loggedAt ?? '';
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });
}

function recalculateReport(meals: MealEntry[], waterLogs: WaterLog[]) {
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: acc.protein + meal.totals.protein,
      carbs: acc.carbs + meal.totals.carbs,
      fats: acc.fats + meal.totals.fats,
      fiber: acc.fiber + meal.totals.fiber,
      sugar: acc.sugar + meal.totals.sugar,
      sodium: acc.sodium + meal.totals.sodium,
      potassium: acc.potassium + meal.totals.potassium,
      calcium: acc.calcium + meal.totals.calcium,
      iron: acc.iron + meal.totals.iron,
      vitaminC: acc.vitaminC + meal.totals.vitaminC,
      vitaminD: acc.vitaminD + meal.totals.vitaminD,
    }),
    { ...emptyTotals }
  );

  return {
    date: new Date().toISOString(),
    totals,
    waterConsumedMl: waterLogs.reduce((sum, log) => sum + log.amountMl, 0),
    mealsLogged: meals.length,
  };
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  waterLogs: [],
  recommendations: [],
  goals: defaultGoals,
  hydrationReminder: defaultReminder,
  dailyReport: emptyDaily,
  weeklyTrend: [],
  monthlyTrend: [],
  isLoading: false,
  isSaving: false,
  error: null,
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const accessToken = requireAccessToken();
      const dashboard = await fetchNutritionDashboard(accessToken);
      set({
        meals: dashboard.meals,
        waterLogs: dashboard.waterLogs,
        recommendations: dashboard.recommendations,
        goals: dashboard.goals,
        hydrationReminder: dashboard.hydrationReminder,
        dailyReport: dashboard.reports.daily,
        weeklyTrend: dashboard.reports.weekly,
        monthlyTrend: dashboard.reports.monthly,
        isLoading: false,
      });
      await useNotificationStore.getState().syncWithContext({
        notificationsEnabled: useAuthStore.getState().user?.preferences.notificationsEnabled ?? false,
        hydrationReminder: dashboard.hydrationReminder,
        workouts: useWorkoutStore.getState().plans,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to load nutrition data.',
        isLoading: false,
      });
    }
  },
  refreshRecommendations: async () => {
    try {
      const accessToken = requireAccessToken();
      const recommendations = await fetchNutritionRecommendations(accessToken);
      set({ recommendations });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to refresh recommendations.' });
    }
  },
  addMeal: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const accessToken = requireAccessToken();
      const meal = await createMeal(accessToken, payload);
      const meals = sortByDateDesc([meal, ...get().meals]);
      set({
        meals,
        dailyReport: recalculateReport(meals, get().waterLogs),
        isSaving: false,
      });
      await get().refreshRecommendations();
      await get().initialize();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to save meal.',
        isSaving: false,
      });
      throw error;
    }
  },
  editMeal: async (mealId, payload) => {
    set({ isSaving: true, error: null });
    try {
      const accessToken = requireAccessToken();
      const meal = await updateMeal(accessToken, mealId, payload);
      const meals = sortByDateDesc(get().meals.map((entry) => (entry.id === mealId ? meal : entry)));
      set({
        meals,
        dailyReport: recalculateReport(meals, get().waterLogs),
        isSaving: false,
      });
      await get().refreshRecommendations();
      await get().initialize();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to update meal.',
        isSaving: false,
      });
      throw error;
    }
  },
  addWater: async (amountMl) => {
    set({ isSaving: true, error: null });
    try {
      const accessToken = requireAccessToken();
      const waterLog = await logWater(accessToken, { amountMl });
      const waterLogs = sortByDateDesc([waterLog, ...get().waterLogs]);
      set({
        waterLogs,
        dailyReport: recalculateReport(get().meals, waterLogs),
        isSaving: false,
      });
      await get().refreshRecommendations();
      await get().initialize();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to log water.',
        isSaving: false,
      });
      throw error;
    }
  },
  saveGoals: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const accessToken = requireAccessToken();
      const response = await updateNutritionGoals(accessToken, payload);
      set({
        goals: response.goals,
        hydrationReminder: response.hydrationReminder,
        isSaving: false,
      });
      await useNotificationStore.getState().updateHydrationAlert(response.hydrationReminder, {
        notificationsEnabled: useAuthStore.getState().user?.preferences.notificationsEnabled ?? false,
        hydrationReminder: response.hydrationReminder,
        workouts: useWorkoutStore.getState().plans,
      });
      await get().initialize();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to update goals.',
        isSaving: false,
      });
      throw error;
    }
  },
}));
