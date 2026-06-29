import { create } from 'zustand';
import Constants from 'expo-constants';
import { getSecureItem, setSecureItem } from '@/services/storage/secureStore';
import { fetchNotificationSettings, updateNotificationSettings } from '@/services/api/auth';
import {
  clearScheduledReminderNotifications,
  registerForPushNotificationsAsync,
  syncReminderNotifications,
} from '@/services/notifications';
import { savePushToken } from '@/services/api/notifications';
import { Platform } from 'react-native';
import { HydrationReminder } from '@/types/nutrition';
import { ReminderSettings, NotificationStatus, DailyReminder, MealReminders } from '@/types/notifications';
import { WorkoutPlan } from '@/types/workout';

const reminderStorageKey = 'notification-reminders';

const defaultDailyReminder = (hour: number, minute = 0): DailyReminder => ({
  enabled: false,
  hour,
  minute,
});

const defaultMealReminders = (): MealReminders => ({
  breakfast: { enabled: true, hour: 8, minute: 0 },
  lunch: { enabled: true, hour: 13, minute: 0 },
  dinner: { enabled: true, hour: 19, minute: 0 },
  snack: { enabled: false, hour: 16, minute: 0 },
});

const defaultHydrationReminder: HydrationReminder = {
  enabled: false,
  intervalMinutes: 120,
  startHour: 8,
  endHour: 21,
};

const defaultSettings: ReminderSettings = {
  workoutReminder: defaultDailyReminder(7, 0),
  missedWorkoutAlert: { enabled: true, hour: 20, minute: 0 },
  mealReminders: defaultMealReminders(),
  hydrationAlert: defaultHydrationReminder,
};

type ReminderContext = {
  notificationsEnabled: boolean;
  workouts?: WorkoutPlan[];
  hydrationReminder?: HydrationReminder;
};

type NotificationStoreState = {
  settings: ReminderSettings;
  status: NotificationStatus;
  isHydrated: boolean;
  isSyncing: boolean;
  initialize: (context: ReminderContext) => Promise<void>;
  syncWithContext: (context: ReminderContext) => Promise<void>;
  updateWorkoutReminder: (patch: Partial<DailyReminder>, context: ReminderContext) => Promise<void>;
  updateMissedWorkoutAlert: (patch: Partial<DailyReminder>, context: ReminderContext) => Promise<void>;
  updateMealReminder: (
    key: keyof MealReminders,
    patch: Partial<DailyReminder>,
    context: ReminderContext
  ) => Promise<void>;
  updateHydrationAlert: (hydrationReminder: HydrationReminder, context: ReminderContext) => Promise<void>;
  clear: () => Promise<void>;
};

function normalizeHour(value: number) {
  return Math.min(23, Math.max(0, Math.round(value)));
}

function normalizeMinute(value: number) {
  return Math.min(59, Math.max(0, Math.round(value)));
}

function normalizeHydrationReminder(reminder: HydrationReminder): HydrationReminder {
  const startHour = normalizeHour(reminder.startHour);
  const endHour = Math.max(startHour, normalizeHour(reminder.endHour));

  return {
    enabled: reminder.enabled,
    intervalMinutes: Math.min(360, Math.max(30, Math.round(reminder.intervalMinutes))),
    startHour,
    endHour,
  };
}

function normalizeDailyReminder(reminder: DailyReminder): DailyReminder {
  return {
    enabled: reminder.enabled,
    hour: normalizeHour(reminder.hour),
    minute: normalizeMinute(reminder.minute),
  };
}

function normalizeSettings(settings: ReminderSettings): ReminderSettings {
  return {
    workoutReminder: normalizeDailyReminder(settings.workoutReminder),
    missedWorkoutAlert: normalizeDailyReminder(settings.missedWorkoutAlert),
    mealReminders: {
      breakfast: normalizeDailyReminder(settings.mealReminders.breakfast),
      lunch: normalizeDailyReminder(settings.mealReminders.lunch),
      dinner: normalizeDailyReminder(settings.mealReminders.dinner),
      snack: normalizeDailyReminder(settings.mealReminders.snack),
    },
    hydrationAlert: normalizeHydrationReminder(settings.hydrationAlert),
  };
}

function isExpoGo() {
  return (
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo'
  );
}

async function persistSettings(settings: ReminderSettings) {
  await setSecureItem(reminderStorageKey, settings);
}

async function loadPersistedSettings() {
  const stored = await getSecureItem<ReminderSettings>(reminderStorageKey);
  return normalizeSettings(stored ?? defaultSettings);
}

function getAuthToken() {
  try {
    const { useAuthStore } = require('@/store/authStore');
    return useAuthStore.getState().tokens?.accessToken ?? null;
  } catch {
    return null;
  }
}

async function loadBackendSettings() {
  const accessToken = getAuthToken();
  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetchNotificationSettings(accessToken);
    return normalizeSettings(response.notificationSettings);
  } catch {
    return null;
  }
}

async function persistBackendSettings(settings: ReminderSettings) {
  const accessToken = getAuthToken();
  if (!accessToken) {
    return;
  }

  await updateNotificationSettings(accessToken, settings);
}

async function persistBackendPushToken(token: string | null) {
  if (!token) return;
  const accessToken = getAuthToken();
  if (!accessToken) return;

  try {
    await savePushToken(accessToken, token, Platform.OS);
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

async function runScheduler(settings: ReminderSettings, context: ReminderContext): Promise<NotificationStatus> {
  if (!context.notificationsEnabled || isExpoGo()) {
    await clearScheduledReminderNotifications();
    return {
      permissionGranted: false,
      permissionStatus: isExpoGo() ? 'expo-go-not-supported' : 'disabled',
      expoPushToken: null,
      scheduledCount: 0,
    };
  }

  const registration = await registerForPushNotificationsAsync();
  const scheduledCount = registration.permissionGranted
    ? await syncReminderNotifications({
        settings,
        workouts: context.workouts ?? [],
      })
    : 0;

  return {
    permissionGranted: registration.permissionGranted,
    permissionStatus: registration.permissionStatus,
    expoPushToken: registration.expoPushToken,
    scheduledCount,
  };
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  settings: defaultSettings,
  status: {
    permissionGranted: false,
    permissionStatus: 'undetermined',
    expoPushToken: null,
    scheduledCount: 0,
  },
  isHydrated: false,
  isSyncing: false,
  initialize: async (context) => {
    let persisted = defaultSettings;
    try {
      persisted = await loadPersistedSettings();
    } catch (err) {
      console.error('Failed to load persisted notification settings:', err);
    }

    const backendSettings = await loadBackendSettings();
    if (backendSettings) {
      persisted = backendSettings;
    }

    const merged = normalizeSettings({
      ...persisted,
      hydrationAlert: context.hydrationReminder ? normalizeHydrationReminder(context.hydrationReminder) : persisted.hydrationAlert,
    });

    set({ settings: merged, isHydrated: true, isSyncing: true });
    try {
      const status = await runScheduler(merged, {
        ...context,
        hydrationReminder: merged.hydrationAlert,
      });
      await persistSettings(merged);
      await persistBackendSettings(merged);
      if (status.expoPushToken) {
        await persistBackendPushToken(status.expoPushToken);
      }
      set({ status, settings: merged, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
  syncWithContext: async (context) => {
    const currentSettings = normalizeSettings({
      ...get().settings,
      hydrationAlert: context.hydrationReminder
        ? normalizeHydrationReminder(context.hydrationReminder)
        : get().settings.hydrationAlert,
    });

    set({ settings: currentSettings, isSyncing: true });
    try {
      const status = await runScheduler(currentSettings, {
        ...context,
        hydrationReminder: currentSettings.hydrationAlert,
      });
      await persistSettings(currentSettings);
      await persistBackendSettings(currentSettings);
      if (status.expoPushToken) {
        await persistBackendPushToken(status.expoPushToken);
      }
      set({ settings: currentSettings, status, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
  updateWorkoutReminder: async (patch, context) => {
    const settings = normalizeSettings({
      ...get().settings,
      workoutReminder: {
        ...get().settings.workoutReminder,
        ...patch,
      },
    });
    set({ settings, isSyncing: true });
    try {
      const status = await runScheduler(settings, context);
      await persistSettings(settings);
      await persistBackendSettings(settings);
      set({ settings, status, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
  updateMissedWorkoutAlert: async (patch, context) => {
    const settings = normalizeSettings({
      ...get().settings,
      missedWorkoutAlert: {
        ...get().settings.missedWorkoutAlert,
        ...patch,
      },
    });
    set({ settings, isSyncing: true });
    try {
      const status = await runScheduler(settings, context);
      await persistSettings(settings);
      await persistBackendSettings(settings);
      set({ settings, status, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
  updateMealReminder: async (key, patch, context) => {
    const settings = normalizeSettings({
      ...get().settings,
      mealReminders: {
        ...get().settings.mealReminders,
        [key]: {
          ...get().settings.mealReminders[key],
          ...patch,
        },
      },
    });
    set({ settings, isSyncing: true });
    try {
      const status = await runScheduler(settings, context);
      await persistSettings(settings);
      await persistBackendSettings(settings);
      set({ settings, status, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
  updateHydrationAlert: async (hydrationReminder, context) => {
    const settings = normalizeSettings({
      ...get().settings,
      hydrationAlert: hydrationReminder,
    });
    set({ settings, isSyncing: true });
    try {
      const status = await runScheduler(settings, {
        ...context,
        hydrationReminder: settings.hydrationAlert,
      });
      await persistSettings(settings);
      await persistBackendSettings(settings);
      set({ settings, status, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },
  clear: async () => {
    await clearScheduledReminderNotifications();
    set({
      settings: defaultSettings,
      status: {
        permissionGranted: false,
        permissionStatus: 'undetermined',
        expoPushToken: null,
        scheduledCount: 0,
      },
      isHydrated: false,
      isSyncing: false,
    });
  },
}));
