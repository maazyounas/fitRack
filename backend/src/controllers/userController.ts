import { Request, Response } from 'express';
import { OnboardingData } from '../models/OnboardingData';
import { UserModel } from '../models/User';
import { decryptValue } from '../utils/crypto';
import { HttpError } from '../utils/http';
import { calculateDailyCalories } from '../utils/calories';

const defaultNotificationSettings = {
  workoutReminder: { enabled: false, hour: 7, minute: 0 },
  missedWorkoutAlert: { enabled: true, hour: 20, minute: 0 },
  mealReminders: {
    breakfast: { enabled: true, hour: 8, minute: 0 },
    lunch: { enabled: true, hour: 13, minute: 0 },
    dinner: { enabled: true, hour: 19, minute: 0 },
    snack: { enabled: false, hour: 16, minute: 0 },
  },
  hydrationAlert: { enabled: false, intervalMinutes: 120, startHour: 8, endHour: 21 },
};

function resolveUserOnboardingCompleted(user: any) {
  return Boolean(user?.profile?.onboardingCompleted || user?.onboardingCompleted || user?.fitnessGoals?.setupCompleted);
}

async function resolveOnboardingCompleted(user: any) {
  return resolveUserOnboardingCompleted(user);
}

function serializeUser(user: any, onboardingCompleted: boolean) {
  const profile = typeof user.profile?.toObject === 'function' ? user.profile.toObject() : user.profile;

  return {
    id: user.id,
    isAdmin: Boolean(user.isAdmin),
    email: decryptValue(user.emailEncrypted),
    phone: decryptValue(user.phoneEncrypted),
    profile: {
      ...profile,
      onboardingCompleted,
    },
    preferences: user.preferences,
    fitnessGoals: user.fitnessGoals,
    onboardingCompleted,
    notificationSettings: user.notificationSettings,
    verification: user.verification,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeDailyReminder(reminder: { enabled?: boolean; hour?: number; minute?: number } | undefined, fallback: { enabled: boolean; hour: number; minute: number }) {
  return {
    enabled: reminder?.enabled ?? fallback.enabled,
    hour: reminder?.hour ?? fallback.hour,
    minute: reminder?.minute ?? fallback.minute,
  };
}

function normalizeMealReminders(mealReminders: any, fallback: any) {
  return {
    breakfast: normalizeDailyReminder(mealReminders?.breakfast, fallback.breakfast),
    lunch: normalizeDailyReminder(mealReminders?.lunch, fallback.lunch),
    dinner: normalizeDailyReminder(mealReminders?.dinner, fallback.dinner),
    snack: normalizeDailyReminder(mealReminders?.snack, fallback.snack),
  };
}

function normalizeHydrationReminder(reminder: any, fallback: { enabled: boolean; intervalMinutes: number; startHour: number; endHour: number }) {
  return {
    enabled: reminder?.enabled ?? fallback.enabled,
    intervalMinutes: reminder?.intervalMinutes ?? fallback.intervalMinutes,
    startHour: reminder?.startHour ?? fallback.startHour,
    endHour: reminder?.endHour ?? fallback.endHour,
  };
}

function inferBodyType(metrics: { heightCm?: number; weightKg?: number; wristCm?: number } | undefined) {
  const heightCm = Number(metrics?.heightCm ?? 0);
  const weightKg = Number(metrics?.weightKg ?? 0);
  const wristCm = Number(metrics?.wristCm ?? 0);

  if (!heightCm || !weightKg) {
    return 'balanced';
  }

  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  if (wristCm && wristCm < 15.5) return 'ectomorph';
  if (bmi < 20 || (wristCm && wristCm < 17)) return 'ectomorph';
  if (bmi >= 27 || (wristCm && wristCm >= 19)) return 'endomorph';
  return 'mesomorph';
}

export async function getMe(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }
  res.json({ user: serializeUser(user, await resolveOnboardingCompleted(user)) });
}

export async function updateProfile(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const { name, age, gender, heightCm, weightKg, profilePictureUrl } = req.body as {
    name?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
    profilePictureUrl?: string;
  };

  if (name !== undefined) user.profile.name = name.trim();
  if (age !== undefined) user.profile.age = age;
  if (gender !== undefined) user.profile.gender = gender;
  if (heightCm !== undefined) user.profile.heightCm = heightCm;
  if (weightKg !== undefined) user.profile.weightKg = weightKg;
  if (profilePictureUrl !== undefined) user.profile.profilePictureUrl = profilePictureUrl;

  user.profile.dailyCalories = calculateDailyCalories({
    age: user.profile.age ?? undefined,
    heightCm: user.profile.heightCm ?? undefined,
    weightKg: user.profile.weightKg ?? undefined,
    gender: user.profile.gender ?? undefined,
  });

  await user.save();
  res.json({ message: 'Profile updated.', user: serializeUser(user, await resolveOnboardingCompleted(user)) });
}

export async function uploadProfilePicture(req: Request & { userId?: string, file?: any }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  if (!req.file || !req.file.path) {
    throw new HttpError(400, 'No image file provided.');
  }

  user.profile.profilePictureUrl = req.file.path;
  await user.save();

  res.json({
    message: 'Profile picture updated.',
    profilePictureUrl: req.file.path,
    user: serializeUser(user, await resolveOnboardingCompleted(user)),
  });
}

export async function getFitnessGoals(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }
  res.json({ fitnessGoals: user.fitnessGoals });
}

export async function updateFitnessGoals(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const { primaryGoal, targetWeightKg, workoutFrequencyPerWeek, setupCompleted } = req.body as {
    primaryGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_fitness';
    targetWeightKg?: number;
    workoutFrequencyPerWeek?: number;
    setupCompleted?: boolean;
  };

  if (primaryGoal !== undefined) user.fitnessGoals.primaryGoal = primaryGoal;
  if (targetWeightKg !== undefined) user.fitnessGoals.targetWeightKg = targetWeightKg;
  if (workoutFrequencyPerWeek !== undefined) user.fitnessGoals.workoutFrequencyPerWeek = workoutFrequencyPerWeek;
  if (setupCompleted !== undefined) user.fitnessGoals.setupCompleted = setupCompleted;

  await user.save();
  res.json({ message: 'Fitness goals updated.', user: serializeUser(user, await resolveOnboardingCompleted(user)) });
}

export async function saveOnboardingProfile(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const {
    gender,
    heightCm,
    weightKg,
    age,
    bodyType,
    primaryGoal,
    targetWeightKg,
    workoutFrequencyPerWeek,
    wristCm,
    onboardingCompleted,
  } = req.body as {
    gender?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
    age?: number;
    bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph' | 'balanced';
    primaryGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_fitness';
    targetWeightKg?: number;
    workoutFrequencyPerWeek?: number;
    wristCm?: number;
    onboardingCompleted?: boolean;
  };

  if (gender !== undefined) user.profile.gender = gender;
  if (heightCm !== undefined) user.profile.heightCm = heightCm;
  if (weightKg !== undefined) user.profile.weightKg = weightKg;
  if (age !== undefined) user.profile.age = age;
  if (heightCm !== undefined || weightKg !== undefined || age !== undefined || gender !== undefined) {
    user.profile.dailyCalories = calculateDailyCalories({
      age: user.profile.age ?? undefined,
      heightCm: user.profile.heightCm ?? undefined,
      weightKg: user.profile.weightKg ?? undefined,
      gender: user.profile.gender ?? undefined,
    });
  }

  if (heightCm !== undefined || weightKg !== undefined || wristCm !== undefined) {
    user.profile.bodyType = inferBodyType({ heightCm, weightKg, wristCm }) as any;
  }
  if (bodyType !== undefined) {
    user.profile.bodyType = bodyType;
  }

  if (primaryGoal !== undefined) user.fitnessGoals.primaryGoal = primaryGoal;
  if (targetWeightKg !== undefined) user.fitnessGoals.targetWeightKg = targetWeightKg;
  if (workoutFrequencyPerWeek !== undefined) user.fitnessGoals.workoutFrequencyPerWeek = workoutFrequencyPerWeek;

  if (onboardingCompleted !== undefined) {
    user.onboardingCompleted = onboardingCompleted;
  }
  user.profile.onboardingCompleted = onboardingCompleted ?? true;
  user.fitnessGoals.setupCompleted = onboardingCompleted ?? true;

  await user.save();
  res.json({ message: 'Onboarding profile saved.', user: serializeUser(user, await resolveOnboardingCompleted(user)) });
}

export async function updatePreferences(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const { language, darkMode, notificationsEnabled, unitSystem } = req.body as {
    language?: 'en' | 'ur';
    autoDetectLanguage?: boolean;
    darkMode?: boolean;
    highContrastMode?: boolean;
    fontScale?: number;
    notificationsEnabled?: boolean;
    voiceCommandsEnabled?: boolean;
    textToSpeechEnabled?: boolean;
    unitSystem?: 'metric' | 'imperial';
  };

  if (language !== undefined) user.preferences.language = language;
  if (req.body.autoDetectLanguage !== undefined) user.preferences.autoDetectLanguage = Boolean(req.body.autoDetectLanguage);
  if (darkMode !== undefined) user.preferences.darkMode = darkMode;
  if (req.body.highContrastMode !== undefined) user.preferences.highContrastMode = Boolean(req.body.highContrastMode);
  if (req.body.fontScale !== undefined) user.preferences.fontScale = Math.min(1.4, Math.max(1, Number(req.body.fontScale)));
  if (notificationsEnabled !== undefined) user.preferences.notificationsEnabled = notificationsEnabled;
  if (req.body.voiceCommandsEnabled !== undefined) {
    user.preferences.voiceCommandsEnabled = Boolean(req.body.voiceCommandsEnabled);
  }
  if (req.body.textToSpeechEnabled !== undefined) {
    user.preferences.textToSpeechEnabled = Boolean(req.body.textToSpeechEnabled);
  }
  if (unitSystem !== undefined) user.preferences.unitSystem = unitSystem;
  if (req.body.adaptiveDifficulty !== undefined) {
    user.preferences.adaptiveDifficulty = Boolean(req.body.adaptiveDifficulty);
  }

  await user.save();
  res.json({ message: 'Preferences updated.', user: serializeUser(user, await resolveOnboardingCompleted(user)) });
}

export async function getNotificationSettings(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  res.json({ notificationSettings: user.notificationSettings ?? defaultNotificationSettings });
}

export async function updateNotificationSettings(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const currentSettings = user.notificationSettings ?? {};
  const { workoutReminder, missedWorkoutAlert, mealReminders, hydrationAlert } = req.body as {
    workoutReminder?: { enabled?: boolean; hour?: number; minute?: number };
    missedWorkoutAlert?: { enabled?: boolean; hour?: number; minute?: number };
    mealReminders?: {
      breakfast?: { enabled?: boolean; hour?: number; minute?: number };
      lunch?: { enabled?: boolean; hour?: number; minute?: number };
      dinner?: { enabled?: boolean; hour?: number; minute?: number };
      snack?: { enabled?: boolean; hour?: number; minute?: number };
    };
    hydrationAlert?: { enabled?: boolean; intervalMinutes?: number; startHour?: number; endHour?: number };
  };

  user.notificationSettings = {
    workoutReminder: normalizeDailyReminder(workoutReminder, currentSettings.workoutReminder ?? defaultNotificationSettings.workoutReminder),
    missedWorkoutAlert: normalizeDailyReminder(
      missedWorkoutAlert,
      currentSettings.missedWorkoutAlert ?? defaultNotificationSettings.missedWorkoutAlert
    ),
    mealReminders: normalizeMealReminders(
      mealReminders,
      currentSettings.mealReminders ?? defaultNotificationSettings.mealReminders
    ),
    hydrationAlert: normalizeHydrationReminder(
      hydrationAlert,
      currentSettings.hydrationAlert ?? defaultNotificationSettings.hydrationAlert
    ),
  };

  await user.save();
  res.json({ message: 'Notification settings updated.', notificationSettings: user.notificationSettings });
}

export async function deactivateAccount(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  user.deactivatedAt = new Date();
  await user.save();
  res.json({ message: 'Account deactivated.' });
}

export async function deleteAccount(req: Request & { userId?: string }, res: Response) {
  const confirmation = req.body.confirmation as string | undefined;

  if (confirmation !== 'DELETE') {
    throw new HttpError(400, 'Confirmation token is required to delete the account.');
  }

  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  await UserModel.deleteOne({ _id: user.id });
  res.json({ message: 'Account and user data permanently deleted.' });
}
