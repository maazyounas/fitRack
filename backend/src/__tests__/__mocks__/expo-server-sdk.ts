export class Expo {
  static isExpoPushToken(token: string) {
    return true;
  }
  chunkPushNotifications(messages: any[]) {
    return [messages];
  }
  async sendPushNotificationsAsync(chunk: any[]) {
    return [];
  }
}
