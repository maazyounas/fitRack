import mongoose, { Document, Schema } from 'mongoose';

/**
 * OnboardingData — stores onboarding selections per user.
 * Created/updated when user completes the 4-step onboarding flow.
 */

export interface IOnboardingData extends Document {
  userId: mongoose.Types.ObjectId;
  gender: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: Array<
    | 'build_muscle'
    | 'gain_strength'
    | 'lose_weight'
    | 'conditioning'
    | 'fundamentals'
    | 'sports_performance'
  >;
  wristCm?: number;
  completedAt: Date;
}

const OnboardingDataSchema = new Schema<IOnboardingData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One record per user (upserted on re-run)
      index: true,
    },
    gender: { type: String, enum: ['male', 'female'], required: true },
    heightCm: { type: Number, required: true, min: 100, max: 250 },
    weightKg: { type: Number, required: true, min: 30, max: 200 },
    age: { type: Number, required: true, min: 10, max: 100 },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      required: true,
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    goals: {
      type: [String],
      enum: ['build_muscle', 'gain_strength', 'lose_weight', 'conditioning', 'fundamentals', 'sports_performance'],
      required: true,
    },
    wristCm: { type: Number, min: 10, max: 30 },
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const OnboardingData = mongoose.model<IOnboardingData>('OnboardingData', OnboardingDataSchema);
