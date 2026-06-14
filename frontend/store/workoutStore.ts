import { create } from 'zustand';
import {
  completeWorkout,
  createWorkoutFromTemplate,
  createWorkoutPlan,
  deleteWorkoutPlan,
  refreshWorkoutAiReview,
  fetchWorkoutPlans,
  fetchWorkoutTemplates,
  getCurrentWorkout,
  reorderWorkoutExercises,
  scheduleWorkoutPlan,
  updateWeeklySchedule,
  updateWorkoutPlan,
} from '@/services/api/workout';
import { WorkoutAiReview, WorkoutCreatePayload, WorkoutPlan, WorkoutTemplate } from '@/types/workout';
import { useAuthStore } from './authStore';
import { useNotificationStore } from './notificationStore';

type WorkoutState = {
  plans: WorkoutPlan[];
  templates: WorkoutTemplate[];
  selectedDate: string;
  selectedPlanId: string | null;
  currentWorkout: WorkoutPlan | null;
  workoutStreak: number;
  isLoading: boolean;
  initialize: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSelectedPlanId: (planId: string | null) => void;
  createPlan: (payload: WorkoutCreatePayload) => Promise<WorkoutPlan>;
  updatePlan: (id: string, payload: Partial<WorkoutCreatePayload>) => Promise<WorkoutPlan>;
  deletePlan: (id: string) => Promise<void>;
  schedulePlan: (id: string, scheduledDate: string) => Promise<WorkoutPlan>;
  updateWeeklySchedule: (id: string, schedule: any[]) => Promise<WorkoutPlan>;
  markCompleted: (id: string, scheduleEntryId?: string) => Promise<WorkoutPlan>;
  loadCurrentWorkout: () => Promise<WorkoutPlan | null>;
  reorderExercises: (id: string, exercises: WorkoutPlan['exercises']) => Promise<WorkoutPlan>;
  calculateStreak: () => number;
  applyTemplate: (templateKey: string) => Promise<WorkoutPlan>;
  refreshAiReview: (id: string) => Promise<WorkoutAiReview>;
};

function requireAccessToken() {
  const accessToken = useAuthStore.getState().tokens?.accessToken;
  if (!accessToken) {
    throw new Error('You need to log in to manage workouts.');
  }
  return accessToken;
}

async function syncWorkoutNotifications(plans: WorkoutPlan[]) {
  const authState = useAuthStore.getState();
  const notificationState = useNotificationStore.getState();
  try {
    await notificationState.syncWithContext({
      notificationsEnabled: authState.user?.preferences.notificationsEnabled ?? false,
      hydrationReminder: notificationState.settings.hydrationAlert,
      workouts: plans,
    });
  } catch (error) {
    console.warn('Workout notification sync failed:', error);
  }
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  plans: [],
  templates: [],
  selectedDate: new Date().toISOString(),
  selectedPlanId: null,
  currentWorkout: null,
  workoutStreak: 0,
  isLoading: false,
  initialize: async () => {
    const accessToken = useAuthStore.getState().tokens?.accessToken;
    if (!accessToken) {
      set({
        plans: [],
        templates: [],
        selectedPlanId: null,
        currentWorkout: null,
        workoutStreak: 0,
        isLoading: false,
      });
      return;
    }

    set({ isLoading: true });
    try {
      const [planResponse, templateResponse] = await Promise.all([
        fetchWorkoutPlans(accessToken),
        fetchWorkoutTemplates(accessToken),
      ]);

      set({
        plans: planResponse.workouts,
        templates: templateResponse.templates,
        selectedPlanId: get().selectedPlanId ?? planResponse.workouts[0]?.id ?? null,
      });
      await syncWorkoutNotifications(planResponse.workouts);
    } finally {
      set({ isLoading: false });
    }
  },
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedPlanId: (selectedPlanId) => set({ selectedPlanId }),
  createPlan: async (payload) => {
    const accessToken = requireAccessToken();
    set({ isLoading: true });
    try {
      const response = await createWorkoutPlan(accessToken, payload);
      set((state) => ({
        plans: [response.workout, ...state.plans],
        selectedPlanId: response.workout.id,
      }));
      await syncWorkoutNotifications([response.workout, ...get().plans.filter((plan) => plan.id !== response.workout.id)]);
      return response.workout;
    } finally {
      set({ isLoading: false });
    }
  },
  updatePlan: async (id, payload) => {
    const accessToken = requireAccessToken();
    set({ isLoading: true });
    try {
      const response = await updateWorkoutPlan(accessToken, id, payload);
      set((state) => ({
        plans: state.plans.map((plan) => (plan.id === id ? response.workout : plan)),
      }));
      await syncWorkoutNotifications(get().plans.map((plan) => (plan.id === id ? response.workout : plan)));
      return response.workout;
    } finally {
      set({ isLoading: false });
    }
  },
  deletePlan: async (id) => {
    const accessToken = requireAccessToken();
    set({ isLoading: true });
    try {
      await deleteWorkoutPlan(accessToken, id);
      const remainingPlans = get().plans.filter((plan) => plan.id !== id);
      set({
        plans: remainingPlans,
        selectedPlanId: get().selectedPlanId === id ? remainingPlans[0]?.id ?? null : get().selectedPlanId,
      });
      await syncWorkoutNotifications(remainingPlans);
    } finally {
      set({ isLoading: false });
    }
  },
  schedulePlan: async (id, scheduledDate) => {
    const accessToken = requireAccessToken();
    const response = await scheduleWorkoutPlan(accessToken, id, scheduledDate);
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? response.workout : plan)),
    }));
    await syncWorkoutNotifications(get().plans.map((plan) => (plan.id === id ? response.workout : plan)));
    return response.workout;
  },
  updateWeeklySchedule: async (id, schedule) => {
    const accessToken = requireAccessToken();
    const response = await updateWeeklySchedule(accessToken, id, schedule);
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? response.workout : plan)),
    }));
    await syncWorkoutNotifications(get().plans.map((plan) => (plan.id === id ? response.workout : plan)));
    return response.workout;
  },
  markCompleted: async (id, scheduleEntryId) => {
    const accessToken = requireAccessToken();
    const response = await completeWorkout(accessToken, id, scheduleEntryId);
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? response.workout : plan)),
    }));
    const newStreak = get().calculateStreak();
    set({ workoutStreak: newStreak });
    await syncWorkoutNotifications(get().plans.map((plan) => (plan.id === id ? response.workout : plan)));
    return response.workout;
  },
  loadCurrentWorkout: async () => {
    const accessToken = requireAccessToken();
    try {
      const response = await getCurrentWorkout(accessToken);
      set({ currentWorkout: response.workout });
      return response.workout;
    } catch {
      set({ currentWorkout: null });
      return null;
    }
  },
  reorderExercises: async (id, exercises) => {
    const accessToken = requireAccessToken();
    const response = await reorderWorkoutExercises(accessToken, id, exercises);
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? response.workout : plan)),
    }));
    return response.workout;
  },
  calculateStreak: () => {
    const plans = get().plans;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);

      const workoutOnDate = plans.some((plan) =>
        plan.schedule.some((entry) => {
          const entryDate = new Date(entry.scheduledDate);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === checkDate.getTime() && entry.completed;
        })
      );

      if (workoutOnDate) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  },
  applyTemplate: async (templateKey) => {
    const accessToken = requireAccessToken();
    const response = await createWorkoutFromTemplate(accessToken, templateKey, false);
    set((state) => ({
      plans: [response.workout, ...state.plans],
      selectedPlanId: response.workout.id,
    }));
    await syncWorkoutNotifications([response.workout, ...get().plans.filter((plan) => plan.id !== response.workout.id)]);
    return response.workout;
  },
  refreshAiReview: async (id) => {
    const accessToken = requireAccessToken();
    const response = await refreshWorkoutAiReview(accessToken, id);
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === id ? { ...plan, aiReview: response.aiReview } : plan
      ),
    }));
    return response.aiReview;
  },
}));
