import type { ReminderSettings } from './notifications';

export type Language = 'en' | 'ur';
export type UnitSystem = 'metric' | 'imperial';

export type UserProfile = {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  dailyCalories?: number | null;
  bodyType?: 'ectomorph' | 'mesomorph' | 'endomorph' | 'balanced';
  profilePictureUrl?: string;
};

export type UserPreferences = {
  language: Language;
  autoDetectLanguage: boolean;
  darkMode: boolean;
  highContrastMode: boolean;
  fontScale: number;
  notificationsEnabled: boolean;
  voiceCommandsEnabled: boolean;
  textToSpeechEnabled: boolean;
  unitSystem: UnitSystem;
  adaptiveDifficulty: boolean;
};

export type FitnessGoals = {
  primaryGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_fitness';
  targetWeightKg?: number;
  workoutFrequencyPerWeek: number;
  setupCompleted: boolean;
};

export type UserVerification = {
  emailVerified: boolean;
  phoneVerified: boolean;
  verifiedAt?: string;
};

export type User = {
  id: string;
  isAdmin: boolean;
  email?: string;
  phone?: string;
  profile: UserProfile;
  preferences: UserPreferences;
  fitnessGoals: FitnessGoals;
  onboardingCompleted?: boolean;
  notificationSettings?: ReminderSettings;
  verification: UserVerification;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  sessionSecret: string;
};

export type AuthResponse = AuthTokens & {
  message: string;
  user: User;
};

export type RegisterPayload = {
  name: string;
  email?: string;
  phone?: string;
  password: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type UpdateProfilePayload = {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  profilePictureUrl?: string;
};

export type UpdatePreferencesPayload = Partial<UserPreferences>;

export type ImageProcessingMode = 'local' | 'cloud';

export type StoredImageRecord = {
  id: string;
  label: string;
  sourceFeature: string;
  createdAt: string;
};

export type ImageConsent = {
  consentGiven: boolean;
  usageExplanationAccepted: boolean;
  processingMode: ImageProcessingMode;
  storageAllowed: boolean;
  consentedAt?: string;
  revokedAt?: string;
  storedImages: StoredImageRecord[];
};
