import cron from 'node-cron';
import { UserModel } from '../models/User';
import { sendPushNotification } from './notificationService';

export function initializeScheduledJobs() {
  // Every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily workout reminder job');
    const users = await UserModel.find({ deactivatedAt: null });
    const userIds = users.map(u => String(u._id));
    
    await sendPushNotification(
      userIds,
      'Time to sweat! 🏋️',
      "Don't forget to log your workout today. Consistency is key!",
      { type: 'workout_reminder' }
    );
  });

  // Every day at 8:00 PM
  cron.schedule('0 20 * * *', async () => {
    console.log('Running daily hydration check job');
    const users = await UserModel.find({ deactivatedAt: null });
    const userIds = users.map(u => String(u._id));

    await sendPushNotification(
      userIds,
      'Stay Hydrated! 💧',
      'Have you reached your water goal for today? Log it now.',
      { type: 'hydration_reminder' }
    );
  });
}
