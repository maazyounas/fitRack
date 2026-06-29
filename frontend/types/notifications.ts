import { HydrationReminder } from './nutrition';

export type DailyReminder = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export type MealReminders = {
  breakfast: DailyReminder;
  lunch: DailyReminder;
  dinner: DailyReminder;
  snack: DailyReminder;
};

export type ReminderSettings = {
  workoutReminder: DailyReminder;
  missedWorkoutAlert: DailyReminder;
  mealReminders: MealReminders;
  hydrationAlert: HydrationReminder;
};

export type NotificationStatus = {
  permissionGranted: boolean;
  permissionStatus: string;
  expoPushToken: string | null;
  scheduledCount: number;
};

export type NotificationType = 'workout' | 'nutrition' | 'community' | 'system';
export type NotificationSource = 'push' | 'broadcast' | 'scheduler' | 'admin' | 'system';

export type NotificationInboxItem = {
  id: string;
  userId: string;
  type: NotificationType;
  source: NotificationSource;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationInboxResponse = {
  notifications: NotificationInboxItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
