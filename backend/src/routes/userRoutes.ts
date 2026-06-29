import { Router } from 'express';
import {
  deactivateAccount,
  deleteAccount,
  getNotificationSettings,
  getFitnessGoals,
  getMe,
  saveOnboardingProfile,
  updateFitnessGoals,
  updateNotificationSettings,
  updatePreferences,
  updateProfile,
  uploadProfilePicture,
} from '../controllers/userController';
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  savePushToken,
} from '../controllers/notificationController';
import { uploadProfileImage } from '../utils/cloudinary';
import {
  deleteStoredImages,
  getImageConsent,
  revokeImageConsent,
  updateImageConsent,
} from '../controllers/imageConsentController';
import { requireAuth } from '../middleware/auth';

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get('/me', getMe);
userRoutes.patch('/profile', updateProfile);
userRoutes.post('/profile/picture', uploadProfileImage.single('image'), uploadProfilePicture);
userRoutes.get('/fitness-goals', getFitnessGoals);
userRoutes.put('/fitness-goals', updateFitnessGoals);
userRoutes.put('/onboarding', saveOnboardingProfile);
userRoutes.patch('/preferences', updatePreferences);
userRoutes.get('/notification-settings', getNotificationSettings);
userRoutes.patch('/notification-settings', updateNotificationSettings);
userRoutes.get('/notifications', getNotifications);
userRoutes.patch('/notifications/read-all', markAllNotificationsRead);
userRoutes.patch('/notifications/:notificationId/read', markNotificationRead);
userRoutes.delete('/notifications', clearNotifications);
userRoutes.post('/notifications/push-token', savePushToken);
userRoutes.get('/image-consent', getImageConsent);
userRoutes.patch('/image-consent', updateImageConsent);
userRoutes.post('/image-consent/revoke', revokeImageConsent);
userRoutes.delete('/image-consent/images', deleteStoredImages);
userRoutes.post('/deactivate', deactivateAccount);
userRoutes.delete('/', deleteAccount);
