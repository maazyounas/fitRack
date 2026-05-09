import { create } from 'zustand';
import { createProgressEntry, fetchProgressDashboard, updateProgressEntry, postStreak } from '@/services/api/progress';
import { ProgressAchievement, ProgressDashboard, ProgressEntry, ProgressPayload, ProgressTrendPoint } from '@/types/progress';
import { useAuthStore } from './authStore';

type ProgressState = {
  entries: ProgressEntry[];
  streakDays: number;
  achievements: ProgressAchievement[];
  dailyTrend: ProgressTrendPoint[];
  weeklyTrend: ProgressTrendPoint[];
  monthlyTrend: ProgressTrendPoint[];
  summary: ProgressDashboard['summary'];
  plateauMessage: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  addEntry: (payload: ProgressPayload) => Promise<void>;
  editEntry: (entryId: string, payload: ProgressPayload) => Promise<void>;
  trackStreak: () => Promise<void>;
};

const emptySummary: ProgressDashboard['summary'] = {
  currentWeightKg: 0,
  weightChangeKg: 0,
  bodyFatTrend: 0,
  muscleMassTrend: 0,
  performanceTrend: 0,
};

function requireAccessToken() {
  const accessToken = useAuthStore.getState().tokens?.accessToken;
  if (!accessToken) {
    throw new Error('You need to log in first.');
  }
  return accessToken;
}

function mergeDashboard(set: any, dashboard: ProgressDashboard) {
  set({
    entries: dashboard.entries,
    streakDays: dashboard.streakDays,
    achievements: dashboard.achievements,
    dailyTrend: dashboard.reports.daily,
    weeklyTrend: dashboard.reports.weekly,
    monthlyTrend: dashboard.reports.monthly,
    summary: dashboard.summary,
    plateauMessage: dashboard.plateauMessage ?? null,
    isLoading: false,
    error: null,
  });
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  entries: [],
  streakDays: 0,
  achievements: [],
  dailyTrend: [],
  weeklyTrend: [],
  monthlyTrend: [],
  summary: emptySummary,
  plateauMessage: null,
  isLoading: false,
  isSaving: false,
  error: null,
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await fetchProgressDashboard(requireAccessToken());
      mergeDashboard(set, dashboard);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load progress.',
      });
    }
  },
  addEntry: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      await createProgressEntry(requireAccessToken(), payload);
      await get().initialize();
      set({ isSaving: false });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Unable to save progress.',
      });
      throw error;
    }
  },
  editEntry: async (entryId, payload) => {
    set({ isSaving: true, error: null });
    try {
      await updateProgressEntry(requireAccessToken(), entryId, payload);
      await get().initialize();
      set({ isSaving: false });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Unable to update progress.',
      });
      throw error;
    }
  },
  trackStreak: async () => {
    try {
      await postStreak(requireAccessToken());
      await get().initialize();
    } catch (error) {
      console.error('Streak update failed', error);
    }
  },
}));
