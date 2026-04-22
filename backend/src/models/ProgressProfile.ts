import { Schema, model } from 'mongoose';

const measurementSchema = new Schema(
  {
    chestCm: { type: Number, min: 0, default: 0 },
    waistCm: { type: Number, min: 0, default: 0 },
    hipsCm: { type: Number, min: 0, default: 0 },
    bicepsCm: { type: Number, min: 0, default: 0 },
    thighCm: { type: Number, min: 0, default: 0 },
    bodyFatPercent: { type: Number, min: 0, max: 100, default: 0 },
    muscleMassKg: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const gymPerformanceSchema = new Schema(
  {
    exerciseName: { type: String, required: true, trim: true },
    weightKg: { type: Number, default: 0, min: 0 },
    reps: { type: Number, default: 0, min: 0 },
    sets: { type: Number, default: 0, min: 0 },
    oneRepMaxEstimate: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const progressEntrySchema = new Schema(
  {
    loggedAt: { type: Date, required: true },
    weightKg: { type: Number, default: 0, min: 0 },
    measurements: { type: measurementSchema, default: () => ({}) },
    gymPerformance: { type: [gymPerformanceSchema], default: [] },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const achievementSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const progressProfileSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    entries: { type: [progressEntrySchema], default: [] },
    streakDays: { type: Number, default: 0, min: 0 },
    achievements: { type: [achievementSchema], default: [] },
  },
  { timestamps: true }
);

export const ProgressProfileModel = model('ProgressProfile', progressProfileSchema);
