import { format, formatDistanceToNowStrict } from 'date-fns';
import type { ReminderSettings } from '@/types/notifications';
import type { WorkoutPlan } from '@/types/workout';

export type NotificationType = 'workout' | 'nutrition' | 'community' | 'system';
export type NotificationSource = 'delivered' | 'upcoming';

export type NativeNotificationRecord = {
  id: string;
  title?: string | null;
  body?: string | null;
  date?: number | null;
  data?: Record<string, unknown> & { type?: string };
};

export type NotificationFeedItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: NotificationType;
  source: NotificationSource;
  timestamp: number;
};

export type BuildNotificationFeedInput = {
  deliveredNotifications?: NativeNotificationRecord[];
  reminderSettings: ReminderSettings;
  workouts: WorkoutPlan[];
  notificationsEnabled: boolean;
  readIds?: string[];
  now?: Date;
};

export type BuildNotificationFeedResult = {
  recent: NotificationFeedItem[];
  upcoming: NotificationFeedItem[];
  unreadCount: number;
};

function formatClock(date: Date) {
  return format(date, 'EEE, h:mm a');
}

function inferType(item: NativeNotificationRecord): NotificationType {
  const rawType = String(item.data?.type ?? '').toLowerCase();
  if (rawType.includes('workout') || rawType.includes('exercise')) return 'workout';
  if (rawType.includes('meal') || rawType.includes('hydration') || rawType.includes('nutrition')) return 'nutrition';
  if (rawType.includes('community') || rawType.includes('social')) return 'community';
  return 'system';
}

function normalizeDeliveredNotification(item: NativeNotificationRecord, readIds: Set<string>, now: Date): NotificationFeedItem {
  const timestamp = item.date ?? now.getTime();
  const date = new Date(timestamp);

  return {
    id: item.id,
    title: item.title?.trim() || 'Notification',
    body: item.body?.trim() || 'You have a new update in FitRack.',
    time: formatDistanceToNowStrict(date, { addSuffix: true }),
    read: readIds.has(item.id),
    type: inferType(item),
    source: 'delivered',
    timestamp,
  };
}

function buildUpcomingWorkoutNotifications(workouts: WorkoutPlan[], now: Date): NotificationFeedItem[] {
  return workouts
    .flatMap((workout) =>
      workout.schedule
        .filter((entry) => !entry.completed && entry.status !== 'completed')
        .map((entry) => ({ workout, entry }))
    )
    .map(({ workout, entry }) => ({
      workout,
      entry,
      timestamp: new Date(entry.scheduledDate).getTime(),
    }))
    .filter(({ timestamp }) => Number.isFinite(timestamp) && timestamp >= now.getTime())
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(0, 3)
    .map(({ workout, entry, timestamp }) => {
      const scheduledDate = new Date(timestamp);
      const scheduledLabel = formatClock(scheduledDate);

      return {
        id: `workout-${workout.id}-${entry._id ?? entry.scheduledDate}`,
        title: `${workout.name} reminder`,
        body: `Workout reminder scheduled for ${scheduledLabel}.`,
        time: formatDistanceToNowStrict(scheduledDate, { addSuffix: true }),
        read: true,
        type: 'workout' as const,
        source: 'upcoming' as const,
        timestamp,
      };
    });
}

function buildMealNotifications(reminderSettings: ReminderSettings, now: Date): NotificationFeedItem[] {
  const meals = [
    ['breakfast', reminderSettings.mealReminders.breakfast, 'Breakfast reminder', 'Start the day with a balanced meal.'],
    ['lunch', reminderSettings.mealReminders.lunch, 'Lunch reminder', 'Refuel and keep your nutrition on track.'],
    ['dinner', reminderSettings.mealReminders.dinner, 'Dinner reminder', 'Close the day strong with a good meal.'],
    ['snack', reminderSettings.mealReminders.snack, 'Snack reminder', 'A smart snack can help steady your energy.'],
  ] as const;

  return meals
    .filter(([, reminder]) => reminder.enabled)
    .map(([key, reminder, title, body]) => {
      const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), reminder.hour, reminder.minute, 0, 0).getTime();
      return {
        id: `meal-${key}`,
        title,
        body: `${body} Daily at ${formatClock(new Date(timestamp))}.`,
        time: `Daily at ${formatClock(new Date(timestamp))}`,
        read: true,
        type: 'nutrition' as const,
        source: 'upcoming' as const,
        timestamp,
      };
    });
}

function buildHydrationNotification(reminderSettings: ReminderSettings): NotificationFeedItem[] {
  const reminder = reminderSettings.hydrationAlert;
  if (!reminder.enabled) return [];

  const startLabel = `${String(reminder.startHour).padStart(2, '0')}:00`;
  const endLabel = `${String(reminder.endHour).padStart(2, '0')}:00`;

  return [
    {
      id: 'hydration-reminder',
      title: 'Hydration reminders',
      body: `Every ${reminder.intervalMinutes} minutes between ${startLabel} and ${endLabel}.`,
      time: 'Scheduled',
      read: true,
      type: 'nutrition' as const,
      source: 'upcoming' as const,
      timestamp: Date.now(),
    },
  ];
}

function buildDisabledNotification(): NotificationFeedItem {
  return {
    id: 'notifications-disabled',
    title: 'Notifications are paused',
    body: 'Enable push notifications to receive workout, meal, and hydration reminders.',
    time: 'Paused',
    read: true,
    type: 'system',
    source: 'upcoming',
    timestamp: Date.now(),
  };
}

export function buildNotificationFeed({
  deliveredNotifications = [],
  reminderSettings,
  workouts,
  notificationsEnabled,
  readIds = [],
  now = new Date(),
}: BuildNotificationFeedInput): BuildNotificationFeedResult {
  const readIdSet = new Set(readIds);

  const recent = deliveredNotifications
    .map((item) => normalizeDeliveredNotification(item, readIdSet, now))
    .sort((left, right) => right.timestamp - left.timestamp);

  const upcoming = notificationsEnabled
    ? [
        ...buildUpcomingWorkoutNotifications(workouts, now),
        ...buildMealNotifications(reminderSettings, now),
        ...buildHydrationNotification(reminderSettings),
      ]
    : [buildDisabledNotification()];

  return {
    recent,
    upcoming,
    unreadCount: recent.filter((item) => !item.read).length,
  };
}