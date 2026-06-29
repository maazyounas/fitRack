import { NotificationTokenModel } from '../models/NotificationToken';
import { UserModel } from '../models/User';
import { UserNotificationModel, type UserNotificationSource, type UserNotificationType } from '../models/UserNotification';
import { sendOtpEmail, sendPasswordChangedEmail } from './emailService';

let expoInstance: any = null;
let expoClass: any = null;

function inferNotificationType(data?: any): UserNotificationType {
  const rawType = String(data?.type ?? '').toLowerCase();
  if (rawType.includes('workout') || rawType.includes('exercise')) return 'workout';
  if (rawType.includes('meal') || rawType.includes('nutrition') || rawType.includes('hydration')) return 'nutrition';
  if (rawType.includes('community') || rawType.includes('social')) return 'community';
  return 'system';
}

async function persistNotifications(
  userIds: string[],
  payload: { title: string; body: string; data?: any; source: UserNotificationSource }
) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUserIds.length) {
    return;
  }

  await UserNotificationModel.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      type: inferNotificationType(payload.data),
      source: payload.source,
      title: payload.title.trim(),
      body: payload.body.trim(),
      data: payload.data ?? {},
      read: false,
      readAt: null,
    }))
  );
}

async function getExpo() {
  if (!expoInstance || !expoClass) {
    const sdk: any = await import('expo-server-sdk');
    expoClass = sdk.Expo;
    expoInstance = new sdk.Expo();
  }

  return { expo: expoInstance, Expo: expoClass };
}

export async function sendPushNotification(userIds: string[], title: string, body: string, data?: any) {
  await persistNotifications(userIds, { title, body, data, source: 'push' });

  const tokens = await NotificationTokenModel.find({ userId: { $in: userIds } });
  const messages: any[] = [];
  const { expo, Expo } = await getExpo();

  for (const token of tokens) {
    if (!Expo.isExpoPushToken(token.expoPushToken)) {
      console.error(`Push token ${token.expoPushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: token.expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk', error);
    }
  }

  return tickets;
}

export async function broadcastNotification(title: string, body: string, data?: any) {
  const activeUsers = await UserModel.find({ deactivatedAt: { $exists: false } }).select('_id').lean();
  const userIds = activeUsers.map((user) => String(user._id));
  await persistNotifications(userIds, { title, body, data, source: 'broadcast' });

  const tokens = await NotificationTokenModel.find();
  const pushTokens = tokens.map(t => t.expoPushToken);
  const { expo, Expo } = await getExpo();
  
  const messages: any[] = pushTokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Error broadcasting notification', error);
    }
  }
}

export async function sendOtpNotification(identifier: string, otp: string, purpose: 'verify-email' | 'verify-phone' | 'password-reset') {
  // Check if identifier is email or phone
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isPhone = /^\+?[\d\s-()]+$/.test(identifier) && identifier.replace(/\D/g, '').length >= 10;

  if (isEmail) {
    // Send via Email using Resend
    const result = await sendOtpEmail(identifier, otp, purpose);
    if (result?.success) {
      return { success: true as const };
    }

    const message = (result as any)?.error?.message || (result as any)?.message || 'Failed to send email OTP.';
    return { success: false as const, message };
  } else if (isPhone) {
    // TODO: Implement SMS via Twilio
    console.log(`[TODO] SMS service not yet implemented. Would send OTP ${otp} to phone ${identifier}`);
    return {
      success: false as const,
      message: 'Phone OTP is not configured yet. Please use email verification for now.',
    };
  } else {
    console.warn(`[WARNING] Invalid identifier format: ${identifier}`);
    return { success: false as const, message: 'Invalid email/phone format.' };
  }
}

export async function sendPasswordChangedNotification(identifier: string) {
  // Check if identifier is email or phone
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  if (isEmail) {
    // Send via Email using Resend
    await sendPasswordChangedEmail(identifier);
  } else {
    // TODO: Implement SMS via Twilio
    console.log(`[TODO] SMS service not yet implemented. Would send password changed alert to ${identifier}`);
  }
}
