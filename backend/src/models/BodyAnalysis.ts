import mongoose, { Document, Schema } from 'mongoose';

/**
 * BodyAnalysis — stores AI scan results per user.
 * Supports full-body and wrist scan modes.
 */

export interface IBodyAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  scanMode: 'body' | 'wrist';
  bodyType: 'ectomorph' | 'mesomorph' | 'endomorph';
  confidence: number;
  /** Normalized landmark coordinates (0–1) */
  landmarks: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    confidence: number;
  }>;
  bodyMetrics: {
    bmi?: number;
    heightCm?: number;
    weightKg?: number;
    wristCm?: number;
    shoulderToWaistRatio?: number;
    shoulderToHipRatio?: number;
    frameSize?: 'small' | 'medium' | 'large';
  };
  workoutSuggestions: Array<{ title: string; description: string }>;
  dietSuggestions: Array<{ title: string; description: string }>;
  postureNotes: string[];
  angleFeedback: string[];
  /** True if analysis was processed on-device */
  processedLocally: boolean;
  /** True if user consented to storing this scan */
  storageAllowed: boolean;
  createdAt: Date;
}

const LandmarkSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    x: { type: Number, required: true, min: 0, max: 1 },
    y: { type: Number, required: true, min: 0, max: 1 },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const SuggestionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const BodyAnalysisSchema = new Schema<IBodyAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scanMode: { type: String, enum: ['body', 'wrist'], required: true },
    bodyType: {
      type: String,
      enum: ['ectomorph', 'mesomorph', 'endomorph'],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    landmarks: [LandmarkSchema],
    bodyMetrics: {
      bmi: Number,
      heightCm: Number,
      weightKg: Number,
      wristCm: Number,
      shoulderToWaistRatio: Number,
      shoulderToHipRatio: Number,
      frameSize: { type: String, enum: ['small', 'medium', 'large'] },
    },
    workoutSuggestions: [SuggestionSchema],
    dietSuggestions: [SuggestionSchema],
    postureNotes: [String],
    angleFeedback: [String],
    processedLocally: { type: Boolean, default: true },
    storageAllowed: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Index for fast user history queries
BodyAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const BodyAnalysis = mongoose.model<IBodyAnalysis>('BodyAnalysis', BodyAnalysisSchema);
