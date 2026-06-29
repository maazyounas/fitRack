import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserNotificationModel } from '../models/UserNotification';
import { NotificationTokenModel } from '../models/NotificationToken';
import { HttpError } from '../utils/http';

type AuthedRequest = Request & { userId?: string };

function serializeNotification(notification: any) {
  return {
    id: String(notification.id ?? notification._id),
    userId: String(notification.userId),
    type: notification.type,
    source: notification.source,
    title: notification.title,
    body: notification.body,
    data: notification.data ?? {},
    read: Boolean(notification.read),
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

function resolveLimit(rawLimit: unknown) {
  const parsed = Number(rawLimit ?? 50);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return Math.min(100, Math.floor(parsed));
}

export async function getNotifications(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new HttpError(401, 'Authentication required.');
  }

  const page = Math.max(1, Number(req.query.page ?? 1) || 1);
  const limit = resolveLimit(req.query.limit);
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    UserNotificationModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserNotificationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    UserNotificationModel.countDocuments({ userId: new Types.ObjectId(userId), read: false }),
  ]);

  res.json({
    notifications: notifications.map(serializeNotification),
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function markNotificationRead(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new HttpError(401, 'Authentication required.');
  }

  const notification = await UserNotificationModel.findOneAndUpdate(
    { _id: req.params.notificationId, userId: new Types.ObjectId(userId) },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw new HttpError(404, 'Notification not found.');
  }

  res.json({ message: 'Notification marked as read.', notification: serializeNotification(notification) });
}

export async function markAllNotificationsRead(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new HttpError(401, 'Authentication required.');
  }

  const result = await UserNotificationModel.updateMany(
    { userId: new Types.ObjectId(userId), read: false },
    { $set: { read: true, readAt: new Date() } }
  );

  res.json({
    message: 'Notifications marked as read.',
    modifiedCount: result.modifiedCount ?? 0,
  });
}

export async function clearNotifications(req: AuthedRequest, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new HttpError(401, 'Authentication required.');
  }

  const result = await UserNotificationModel.deleteMany({ userId: new Types.ObjectId(userId) });
  res.json({
    message: 'Notifications cleared.',
    deletedCount: result.deletedCount ?? 0,
  });
}

import { NextFunction } from 'express';

export async function savePushToken(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new HttpError(401, 'Authentication required.');
    }

    const { token, deviceType } = req.body as { token: string; deviceType?: string };

    if (!token) {
      throw new HttpError(400, 'Token is required.');
    }

    // Upsert the token for this device
    await NotificationTokenModel.findOneAndUpdate(
      { expoPushToken: token },
      { $set: { userId: new Types.ObjectId(userId), deviceType: deviceType || 'unknown', lastUsedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ message: 'Push token saved successfully.' });
  } catch (error) {
    next(error);
  }
}
