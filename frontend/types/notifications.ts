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
