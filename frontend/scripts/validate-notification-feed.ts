import assert from 'node:assert/strict';
import { buildNotificationFeed } from '../services/notifications/feed';
import type { WorkoutPlan } from '../types/workout';

const workouts = [
  {
    id: 'workout-1',
    name: 'Upper Body',
    description: 'Push and pull focus',
    difficulty: 'beginner',
    isTemplate: false,
    estimatedDurationMinutes: 45,
    exercises: [],
    schedule: [
      {
        scheduledDate: '2026-06-29T09:00:00.000Z',
        status: 'scheduled',
        completed: false,
      },
    ],
  } satisfies WorkoutPlan,
];

const feed = buildNotificationFeed({
  deliveredNotifications: [
    {
      id: 'delivered-1',
      title: 'Workout complete',
      body: 'Nice work finishing your session.',
      date: new Date('2026-06-28T06:00:00.000Z').getTime(),
      data: { type: 'workout-reminder' },
    },
  ],
  reminderSettings: {
    workoutReminder: { enabled: true, hour: 7, minute: 30 },
    missedWorkoutAlert: { enabled: true, hour: 20, minute: 0 },
    mealReminders: {
      breakfast: { enabled: true, hour: 8, minute: 0 },
      lunch: { enabled: false, hour: 13, minute: 0 },
      dinner: { enabled: true, hour: 19, minute: 0 },
      snack: { enabled: false, hour: 16, minute: 0 },
    },
    hydrationAlert: {
      enabled: true,
      intervalMinutes: 120,
      startHour: 8,
      endHour: 20,
    },
  },
  workouts,
  notificationsEnabled: true,
  readIds: ['delivered-1'],
  now: new Date('2026-06-28T08:00:00.000Z'),
});

assert.equal(feed.recent.length, 1);
assert.equal(feed.recent[0].read, true);
assert.equal(feed.recent[0].type, 'workout');
assert.ok(feed.upcoming.some((item) => item.title.includes('Upper Body')));
assert.ok(feed.upcoming.some((item) => item.title === 'Breakfast reminder'));
assert.ok(feed.upcoming.some((item) => item.title === 'Hydration reminders'));

console.log('notification feed helper passed');