import { create } from 'zustand';
import {
  completeWorkout,
  createWorkoutFromTemplate,
  createWorkoutPlan,
  deleteWorkoutPlan,
  fetchWorkoutAiReview,
  fetchWorkoutPlans,
  fetchWorkoutTemplates,
  scheduleWorkoutPlan,
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
  isLoading: boolean;
  initialize: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSelectedPlanId: (planId: string | null) => void;
  createPlan: (payload: WorkoutCreatePayload) => Promise<WorkoutPlan>;
  updatePlan: (id: string, payload: Partial<WorkoutCreatePayload>) => Promise<WorkoutPlan>;
  deletePlan: (id: string) => Promise<void>;
  schedulePlan: (id: string, scheduledDate: string) => Promise<WorkoutPlan>;
  markCompleted: (id: string, scheduleEntryId: string) => Promise<WorkoutPlan>;
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
  await notificationState.syncWithContext({
    notificationsEnabled: authState.user?.preferences.notificationsEnabled ?? false,
    hydrationReminder: notificationState.settings.hydrationAlert,
    workouts: plans,
  });
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  plans: [],
  templates: [],
  selectedDate: new Date().toISOString(),
  selectedPlanId: null,
  isLoading: false,
  initialize: async () => {
    const accessToken = requireAccessToken();
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
  markCompleted: async (id, scheduleEntryId) => {
    const accessToken = requireAccessToken();
    const response = await completeWorkout(accessToken, id, scheduleEntryId);
    set((state) => ({
      plans: state.plans.map((plan) => (plan.id === id ? response.workout : plan)),
    }));
    await syncWorkoutNotifications(get().plans.map((plan) => (plan.id === id ? response.workout : plan)));
    return response.workout;
  },
  applyTemplate: async (templateKey) => {
    const accessToken = requireAccessToken();
    const response = await createWorkoutFromTemplate(accessToken, templateKey, true);
    set((state) => ({
      plans: [response.workout, ...state.plans],
      selectedPlanId: response.workout.id,
    }));
    await syncWorkoutNotifications([response.workout, ...get().plans.filter((plan) => plan.id !== response.workout.id)]);
    return response.workout;
  },
  refreshAiReview: async (id) => {
    const accessToken = requireAccessToken();
    const response = await fetchWorkoutAiReview(accessToken, id);
    set((state) => ({
      plans: state.plans.map((plan) =>
        plan.id === id ? { ...plan, aiReview: response.aiReview } : plan
      ),
    }));
    return response.aiReview;
  },
}));
