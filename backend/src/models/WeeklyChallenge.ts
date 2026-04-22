import { Schema, model } from 'mongoose';

const participantSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true, min: 0, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const weeklyChallengeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    metricLabel: { type: String, required: true, trim: true },
    unitLabel: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    participants: { type: [participantSchema], default: [] },
  },
  { timestamps: true }
);

export const WeeklyChallengeModel = model('WeeklyChallenge', weeklyChallengeSchema);
