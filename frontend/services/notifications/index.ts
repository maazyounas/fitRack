import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage/secureStore';
import { ReminderSettings } from '@/types/notifications';
import { WorkoutPlan } from '@/types/workout';

const scheduledIdsStorageKey = 'notification-scheduled-ids';
const reminderChannelId = 'fitrack-reminders';

// Use dynamic import to avoid importing expo-notifications on web
async function getNotificationsModule() {
  if (Platform.OS === 'web') {
    throw new Error('Notifications not supported on web');
  }
  return await import('expo-notifications');
}

function isExpoGo() {
  return (
    Constants.executionEnvironment === 'storeClient' ||
    Constants.appOwnership === 'expo'
  );
}

type PushRegistration = {
  permissionGranted: boolean;
  permissionStatus: string;
  expoPushToken: string | null;
};

type ReminderSyncInput = {
  settings: ReminderSettings;
  workouts: WorkoutPlan[];
};

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }
  const Notifications = await getNotificationsModule();
  await Notifications.setNotificationChannelAsync(reminderChannelId, {
    name: 'FITRACK reminders',
    description: 'Workout, meal, hydration, and missed workout reminders.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 120, 200],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

async function readScheduledIds() {
  return (await getSecureItem<string[]>(scheduledIdsStorageKey)) ?? [];
}

async function persistScheduledIds(ids: string[]) {
  await setSecureItem(scheduledIdsStorageKey, ids);
}

async function buildDailyDate(hour: number, minute: number) {
  const Notifications = await getNotificationsModule();
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    ...(Platform.OS === 'android' ? { channelId: reminderChannelId } : {}),
  } as const;
}

async function buildDateForDay(dateString: string, hour: number, minute: number) {
  const Notifications = await getNotificationsModule();
  const base = new Date(dateString);
  const date = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    hour,
    minute,
    0,
    0
  );
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
    ...(Platform.OS === 'android' ? { channelId: reminderChannelId } : {}),
  } as const;
}

async function scheduleNotification(content: any, trigger: any) {
  const Notifications = await getNotificationsModule();
  return Notifications.scheduleNotificationAsync({ content, trigger });
}

function getFutureWorkoutSchedules(workouts: WorkoutPlan[]) {
  return workouts.flatMap((workout) =>
    workout.schedule
      .filter((entry) => !entry.completed && entry.status !== 'completed')
      .map((entry) => ({ workout, entry }))
  );
}

async function scheduleWorkoutNotifications(settings: ReminderSettings, workouts: WorkoutPlan[]) {
  const scheduledIds: string[] = [];
  const workoutEntries = getFutureWorkoutSchedules(workouts);

  for (const { workout, entry } of workoutEntries) {
    if (settings.workoutReminder.enabled) {
      const reminderDate = await buildDateForDay(
        entry.scheduledDate,
        settings.workoutReminder.hour,
        settings.workoutReminder.minute
      );

      if (reminderDate.date.getTime() > Date.now()) {
        const id = await scheduleNotification(
          {
            title: 'Workout reminder',
            body: `${workout.name} is on deck today. Lace up and get after it.`,
            data: {
              type: 'workout-reminder',
              workoutId: workout.id,
              scheduledDate: entry.scheduledDate,
            },
          },
          reminderDate
        );
        scheduledIds.push(id);
      }
    }

    if (settings.missedWorkoutAlert.enabled) {
      const missedAlertDate = await buildDateForDay(
        entry.scheduledDate,
        settings.missedWorkoutAlert.hour,
        settings.missedWorkoutAlert.minute
      );

      if (missedAlertDate.date.getTime() > Date.now()) {
        const id = await scheduleNotification(
          {
            title: 'Missed workout check-in',
            body: `You still have ${workout.name} pending today. A short session still counts.`,
            data: {
              type: 'missed-workout-alert',
              workoutId: workout.id,
              scheduledDate: entry.scheduledDate,
            },
          },
          missedAlertDate
        );
        scheduledIds.push(id);
      }
    }
  }

  return scheduledIds;
}

async function scheduleMealNotifications(settings: ReminderSettings) {
  const scheduledIds: string[] = [];
  const mealEntries = [
    ['breakfast', settings.mealReminders.breakfast, 'Breakfast reminder', 'Fuel up early and log your first meal.'],
    ['lunch', settings.mealReminders.lunch, 'Lunch reminder', 'Refuel for the rest of the day and keep your nutrition on track.'],
    ['dinner', settings.mealReminders.dinner, 'Dinner reminder', 'Close the day strong with a balanced dinner.'],
    ['snack', settings.mealReminders.snack, 'Snack reminder', 'A smart snack can keep your energy steady between meals.'],
  ] as const;

  for (const [key, reminder, title, body] of mealEntries) {
    if (!reminder.enabled) {
      continue;
    }

    const trigger = await buildDailyDate(reminder.hour, reminder.minute);
    const id = await scheduleNotification(
      {
        title,
        body,
        data: { type: `${key}-meal-reminder` },
      },
      trigger
    );
    scheduledIds.push(id);
  }

  return scheduledIds;
}

async function scheduleHydrationNotifications(settings: ReminderSettings) {
  const scheduledIds: string[] = [];
  const reminder = settings.hydrationAlert;

  if (!reminder.enabled) {
    return scheduledIds;
  }

  for (
    let minutes = reminder.startHour * 60;
    minutes <= reminder.endHour * 60;
    minutes += reminder.intervalMinutes
  ) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const trigger = await buildDailyDate(hour, minute);
    const id = await scheduleNotification(
      {
        title: 'Hydration alert',
        body: 'Drink some water and keep your momentum going.',
        data: { type: 'hydration-alert' },
      },
      trigger
    );
    scheduledIds.push(id);
  }

  return scheduledIds;
}

export async function clearScheduledReminderNotifications() {
  if (Platform.OS === 'web' || isExpoGo()) {
    return;
  }
  const scheduledIds = await readScheduledIds();
  const Notifications = await getNotificationsModule();
  await Promise.all(scheduledIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await removeSecureItem(scheduledIdsStorageKey);
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistration> {
  // Skip push token registration on web (not supported)
  if (Platform.OS === 'web' || isExpoGo()) {
    return {
      permissionGranted: false,
      permissionStatus: Platform.OS === 'web' ? 'web-not-supported' : 'expo-go-not-supported',
      expoPushToken: null,
    };
  }

  await ensureAndroidChannel();
  const Notifications = await getNotificationsModule();
  // set a notification handler on native platforms
  Notifications.setNotificationHandler?.({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;
  let granted = permission.granted;

  if (!granted) {
    const nextPermission = await Notifications.requestPermissionsAsync();
    status = nextPermission.status;
    granted = nextPermission.granted;
  }

  if (!granted) {
    return {
      permissionGranted: false,
      permissionStatus: status,
      expoPushToken: null,
    };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null;

  if (!projectId) {
    return {
      permissionGranted: true,
      permissionStatus: status,
      expoPushToken: null,
    };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return {
      permissionGranted: true,
      permissionStatus: status,
      expoPushToken: token.data,
    };
  } catch {
    return {
      permissionGranted: true,
      permissionStatus: status,
      expoPushToken: null,
    };
  }
}

export async function syncReminderNotifications({ settings, workouts }: ReminderSyncInput) {
  // Skip reminder scheduling on web (not supported)
  if (Platform.OS === 'web' || isExpoGo()) {
    return 0;
  }

  await clearScheduledReminderNotifications();
  await ensureAndroidChannel();

  const workoutIds = await scheduleWorkoutNotifications(settings, workouts);
  const mealIds = await scheduleMealNotifications(settings);
  const hydrationIds = await scheduleHydrationNotifications(settings);
  const allIds = [...workoutIds, ...mealIds, ...hydrationIds];

  await persistScheduledIds(allIds);
  return allIds.length;
}
