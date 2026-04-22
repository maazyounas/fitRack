import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { decryptValue } from '../utils/crypto';
import { HttpError } from '../utils/http';
import { calculateDailyCalories } from '../utils/calories';

function serializeUser(user: any) {
  return {
    id: user.id,
    isAdmin: Boolean(user.isAdmin),
    email: decryptValue(user.emailEncrypted),
    phone: decryptValue(user.phoneEncrypted),
    profile: user.profile,
    preferences: user.preferences,
    verification: user.verification,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getMe(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }
  res.json({ user: serializeUser(user) });
}

export async function updateProfile(req: Request & { userId?: string }, res: Response) {
  const user = await UserModel.findById(req.userId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const { name, age, heightCm, weightKg, profilePictureUrl } = req.body as {
    name?: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    profilePictureUrl?: string;
  };

  if (name !== undefined) user.profile.name = name.trim();
  if (age !== undefined) user.profile.age = age;
  if (heightCm !== undefined) user.profile.heightCm = heightCm;
  if (weightKg !== undefined) user.profile.weightKg = weightKg;
  if (profilePictureUrl !== undefined) user.profile.profilePictureUrl = profilePictureUrl;

  user.profile.dailyCalories = calculateDailyCalories({
    age: user.profile.age ?? undefined,
    heightCm: user.profile.heightCm ?? undefined,
    weightKg: user.profile.weightKg ?? undefined,
  });

  await user.save();
  res.json({ message: 'Profile updated.', user: serializeUser(user) });
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

  await user.save();
  res.json({ message: 'Preferences updated.', user: serializeUser(user) });
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
