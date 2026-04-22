import { Schema, model } from 'mongoose';

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    muscleGroup: { type: String, required: true, trim: true },
    equipment: { type: String, default: 'Bodyweight' },
    sets: { type: Number, required: true, min: 1, max: 20 },
    reps: { type: Number, required: true, min: 1, max: 100 },
    restSeconds: { type: Number, required: true, min: 0, max: 600 },
    notes: { type: String, default: '' },
    intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    order: { type: Number, required: true },
  },
  { _id: true }
);

const scheduleEntrySchema = new Schema(
  {
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed'],
      default: 'scheduled',
    },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    notes: { type: String, default: '' },
    missedNotificationSent: { type: Boolean, default: false },
  },
  { _id: true }
);

const workoutPlanSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    isTemplate: { type: Boolean, default: false },
    sourceTemplateKey: { type: String, default: '' },
    estimatedDurationMinutes: { type: Number, default: 45 },
    exercises: { type: [exerciseSchema], default: [] },
    schedule: { type: [scheduleEntrySchema], default: [] },
    aiReview: {
      completionRate: { type: Number, default: 0 },
      outdated: { type: Boolean, default: false },
      intensityAdjustment: { type: String, default: '' },
      outdatedReason: { type: String, default: '' },
      exerciseVariations: {
        type: [
          new Schema(
            {
              exerciseName: String,
              suggestion: String,
            },
            { _id: false }
          ),
        ],
        default: [],
      },
    },
  },
  { timestamps: true }
);

export const WorkoutPlanModel = model('WorkoutPlan', workoutPlanSchema);
