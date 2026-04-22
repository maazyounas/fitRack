import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage/secureStore';
import { ReminderSettings } from '@/types/notifications';
import { WorkoutPlan } from '@/types/workout';

const scheduledIdsStorageKey = 'notification-scheduled-ids';
const reminderChannelId = 'fitrack-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

function buildDailyDate(hour: number, minute: number) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    ...(Platform.OS === 'android' ? { channelId: reminderChannelId } : {}),
  } as const;
}

function buildDateForDay(dateString: string, hour: number, minute: number) {
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

async function scheduleNotification(
  content: Notifications.NotificationContentInput,
  trigger: Notifications.NotificationTriggerInput
) {
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
      const reminderDate = buildDateForDay(
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
      const missedAlertDate = buildDateForDay(
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

    const id = await scheduleNotification(
      {
        title,
        body,
        data: { type: `${key}-meal-reminder` },
      },
      buildDailyDate(reminder.hour, reminder.minute)
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
    const id = await scheduleNotification(
      {
        title: 'Hydration alert',
        body: 'Drink some water and keep your momentum going.',
        data: { type: 'hydration-alert' },
      },
      buildDailyDate(hour, minute)
    );
    scheduledIds.push(id);
  }

  return scheduledIds;
}

export async function clearScheduledReminderNotifications() {
  const scheduledIds = await readScheduledIds();
  await Promise.all(scheduledIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  await removeSecureItem(scheduledIdsStorageKey);
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistration> {
  await ensureAndroidChannel();

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
  await clearScheduledReminderNotifications();
  await ensureAndroidChannel();

  const workoutIds = await scheduleWorkoutNotifications(settings, workouts);
  const mealIds = await scheduleMealNotifications(settings);
  const hydrationIds = await scheduleHydrationNotifications(settings);
  const allIds = [...workoutIds, ...mealIds, ...hydrationIds];

  await persistScheduledIds(allIds);
  return allIds.length;
}
