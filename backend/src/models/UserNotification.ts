import { Document, Schema, model } from 'mongoose';

export type UserNotificationType = 'workout' | 'nutrition' | 'community' | 'system';
export type UserNotificationSource = 'push' | 'broadcast' | 'scheduler' | 'admin' | 'system';

export interface IUserNotification extends Document {
  userId: Schema.Types.ObjectId;
  type: UserNotificationType;
  source: UserNotificationSource;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userNotificationSchema = new Schema<IUserNotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['workout', 'nutrition', 'community', 'system'],
      default: 'system',
      index: true,
    },
    source: {
      type: String,
      enum: ['push', 'broadcast', 'scheduler', 'admin', 'system'],
      default: 'system',
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const UserNotificationModel = model<IUserNotification>('UserNotification', userNotificationSchema);