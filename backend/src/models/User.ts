import { Schema, model } from 'mongoose';

const encryptedFieldSchema = new Schema(
  {
    iv: { type: String, required: true },
    content: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    language: { type: String, enum: ['en', 'ur'], default: 'en' },
    autoDetectLanguage: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    highContrastMode: { type: Boolean, default: false },
    fontScale: { type: Number, default: 1, min: 1, max: 1.4 },
    notificationsEnabled: { type: Boolean, default: true },
    voiceCommandsEnabled: { type: Boolean, default: false },
    textToSpeechEnabled: { type: Boolean, default: false },
    unitSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    adaptiveDifficulty: { type: Boolean, default: true },
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 1, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    heightCm: { type: Number, min: 50, max: 300 },
    weightKg: { type: Number, min: 20, max: 500 },
    dailyCalories: { type: Number, default: null },
    bodyType: {
      type: String,
      enum: ['ectomorph', 'mesomorph', 'endomorph', 'balanced'],
      default: 'balanced',
    },
    profilePictureUrl: { type: String, default: '' },
  },
  { _id: false }
);

const fitnessGoalsSchema = new Schema(
  {
    primaryGoal: { type: String, enum: ['weight_loss', 'muscle_gain', 'maintenance', 'general_fitness'], default: 'general_fitness' },
    targetWeightKg: { type: Number, min: 20, max: 500, default: null },
    workoutFrequencyPerWeek: { type: Number, min: 1, max: 7, default: 3 },
    setupCompleted: { type: Boolean, default: false }
  },
  { _id: false }
);

const dailyReminderSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    hour: { type: Number, min: 0, max: 23, default: 0 },
    minute: { type: Number, min: 0, max: 59, default: 0 },
  },
  { _id: false }
);

const mealRemindersSchema = new Schema(
  {
    breakfast: { type: dailyReminderSchema, default: () => ({ enabled: true, hour: 8, minute: 0 }) },
    lunch: { type: dailyReminderSchema, default: () => ({ enabled: true, hour: 13, minute: 0 }) },
    dinner: { type: dailyReminderSchema, default: () => ({ enabled: true, hour: 19, minute: 0 }) },
    snack: { type: dailyReminderSchema, default: () => ({ enabled: false, hour: 16, minute: 0 }) },
  },
  { _id: false }
);

const hydrationReminderSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    intervalMinutes: { type: Number, min: 30, max: 360, default: 120 },
    startHour: { type: Number, min: 0, max: 23, default: 8 },
    endHour: { type: Number, min: 0, max: 23, default: 21 },
  },
  { _id: false }
);

const notificationSettingsSchema = new Schema(
  {
    workoutReminder: { type: dailyReminderSchema, default: () => ({ enabled: false, hour: 7, minute: 0 }) },
    missedWorkoutAlert: { type: dailyReminderSchema, default: () => ({ enabled: true, hour: 20, minute: 0 }) },
    mealReminders: { type: mealRemindersSchema, default: () => ({}) },
    hydrationAlert: { type: hydrationReminderSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    emailEncrypted: encryptedFieldSchema,
    emailHash: { type: String, unique: true, sparse: true, index: true },
    phoneEncrypted: encryptedFieldSchema,
    phoneHash: { type: String, unique: true, sparse: true, index: true },
    passwordHash: { type: String, required: true },
    profile: { type: profileSchema, required: true },
    preferences: { type: preferencesSchema, default: () => ({}) },
    fitnessGoals: { type: fitnessGoalsSchema, default: () => ({}) },
    onboardingCompleted: { type: Boolean, default: false },
    notificationSettings: { type: notificationSettingsSchema, default: () => ({}) },
    verification: {
      emailVerified: { type: Boolean, default: false },
      phoneVerified: { type: Boolean, default: false },
      verifiedAt: Date,
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    isAdmin: { type: Boolean, default: false },
    deactivatedAt: Date,
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const UserModel = model('User', userSchema);
