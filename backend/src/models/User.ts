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
  },
  { _id: false }
);

const profileSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 1, max: 120 },
    heightCm: { type: Number, min: 50, max: 300 },
    weightKg: { type: Number, min: 20, max: 500 },
    dailyCalories: { type: Number, default: null },
    profilePictureUrl: { type: String, default: '' },
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
