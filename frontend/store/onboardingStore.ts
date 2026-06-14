/**
 * Onboarding Store — tracks gender, metrics, goals, and completion state.
 * Persists to expo-secure-store. Syncs to backend on completion via
 * existing updateProfile + updateFitnessGoals API actions.
 */

import { create } from 'zustand';
import { getSecureItem, setSecureItem } from '@/services/storage/secureStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingGender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type OnboardingGoal =
  | 'build_muscle'
  | 'gain_strength'
  | 'lose_weight'
  | 'conditioning'
  | 'fundamentals'
  | 'sports_performance';

export type OnboardingMetrics = {
  heightCm: number;
  weightKg: number;
  age: number;
  activityLevel: ActivityLevel;
  experience: ExperienceLevel;
  wristCm?: number;
};

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph' | 'balanced';

export type OnboardingState = {
  gender: OnboardingGender | null;
  metrics: OnboardingMetrics | null;
  goals: OnboardingGoal[];
  bodyType: BodyType | null;
  onboardingCompleted: boolean;
  isHydrated: boolean;

  // Actions
  setGender: (gender: OnboardingGender) => void;
  setMetrics: (metrics: OnboardingMetrics) => void;
  setGoals: (goals: OnboardingGoal[]) => void;
  setBodyType: (bodyType: BodyType) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  initialize: () => Promise<void>;
};

const STORAGE_KEY = 'onboarding_v1';

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  gender: null,
  metrics: null,
  goals: [],
  bodyType: null,
  onboardingCompleted: false,
  isHydrated: false,

  initialize: async () => {
    try {
      const stored = await getSecureItem<{
        gender: OnboardingGender | null;
        metrics: OnboardingMetrics | null;
        goals: OnboardingGoal[];
        bodyType: BodyType | null;
        onboardingCompleted: boolean;
      }>(STORAGE_KEY);

      if (stored) {
        set({
          gender: stored.gender ?? null,
          metrics: stored.metrics ?? null,
          goals: stored.goals ?? [],
          bodyType: stored.bodyType ?? null,
          onboardingCompleted: stored.onboardingCompleted ?? false,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  setGender: (gender) => {
    set({ gender });
    void persist(get);
  },

  setMetrics: (metrics) => {
    set({ metrics });
    void persist(get);
  },

  setGoals: (goals) => {
    set({ goals });
    void persist(get);
  },

  setBodyType: (bodyType) => {
    set({ bodyType });
    void persist(get);
  },

  setOnboardingCompleted: (completed) => {
    set({ onboardingCompleted: completed });
    void persist(get);
  },

  completeOnboarding: async () => {
    set({ onboardingCompleted: true });
    await persist(get);
  },

  resetOnboarding: async () => {
    set({ gender: null, metrics: null, goals: [], bodyType: null, onboardingCompleted: false });
    await setSecureItem(STORAGE_KEY, {
      gender: null,
      metrics: null,
      goals: [],
      bodyType: null,
      onboardingCompleted: false,
    });
  },
}));

async function persist(get: () => OnboardingState) {
  const { gender, metrics, goals, bodyType, onboardingCompleted } = get();
  await setSecureItem(STORAGE_KEY, { gender, metrics, goals, bodyType, onboardingCompleted });
}
