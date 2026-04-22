import { Schema, model } from 'mongoose';

const storedImageSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    sourceFeature: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const imageConsentSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    consentGiven: { type: Boolean, default: false },
    usageExplanationAccepted: { type: Boolean, default: false },
    processingMode: {
      type: String,
      enum: ['local', 'cloud'],
      default: 'local',
    },
    storageAllowed: { type: Boolean, default: false },
    consentedAt: Date,
    revokedAt: Date,
    storedImages: { type: [storedImageSchema], default: [] },
  },
  { timestamps: true }
);

export const ImageConsentModel = model('ImageConsent', imageConsentSchema);
