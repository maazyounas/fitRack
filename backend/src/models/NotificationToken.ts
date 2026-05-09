import { Schema, model } from 'mongoose';

const notificationTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expoPushToken: { type: String, required: true, unique: true },
    deviceType: { type: String, default: 'unknown' },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const NotificationTokenModel = model('NotificationToken', notificationTokenSchema);
