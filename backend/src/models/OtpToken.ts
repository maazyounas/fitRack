import { Schema, model } from 'mongoose';

const otpTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: {
      type: String,
      enum: ['verify-email', 'verify-phone', 'password-reset'],
      required: true,
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: Date,
  },
  { timestamps: true }
);

export const OtpTokenModel = model('OtpToken', otpTokenSchema);
