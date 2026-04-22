import { Schema, model } from 'mongoose';

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    userAgent: String,
    ipAddress: String,
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    lastActivityAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SessionModel = model('Session', sessionSchema);
