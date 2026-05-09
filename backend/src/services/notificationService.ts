import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { NotificationTokenModel } from '../models/NotificationToken';

const expo = new Expo();

export async function sendPushNotification(userIds: string[], title: string, body: string, data?: any) {
  const tokens = await NotificationTokenModel.find({ userId: { $in: userIds } });
  const messages: ExpoPushMessage[] = [];

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
  const tokens = await NotificationTokenModel.find();
  const pushTokens = tokens.map(t => t.expoPushToken);
  
  const messages: ExpoPushMessage[] = pushTokens
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

export async function sendOtpNotification(identifier: string, otp: string, purpose: string) {
  // In a real app, this would use Twilio or SendGrid depending on identifier type (email/phone)
  console.log(`[STUB] Sending OTP ${otp} to ${identifier} for ${purpose}`);
}

export async function sendPasswordChangedNotification(identifier: string) {
  // In a real app, this would use Twilio or SendGrid depending on identifier type (email/phone)
  console.log(`[STUB] Sending password changed alert to ${identifier}`);
}
