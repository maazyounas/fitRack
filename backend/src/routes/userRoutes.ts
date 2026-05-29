import { Router } from 'express';
import {
  deactivateAccount,
  deleteAccount,
  getNotificationSettings,
  getFitnessGoals,
  getMe,
  updateFitnessGoals,
  updateNotificationSettings,
  updatePreferences,
  updateProfile,
  uploadProfilePicture,
} from '../controllers/userController';
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
userRoutes.patch('/preferences', updatePreferences);
userRoutes.get('/notification-settings', getNotificationSettings);
userRoutes.patch('/notification-settings', updateNotificationSettings);
userRoutes.get('/image-consent', getImageConsent);
userRoutes.patch('/image-consent', updateImageConsent);
userRoutes.post('/image-consent/revoke', revokeImageConsent);
userRoutes.delete('/image-consent/images', deleteStoredImages);
userRoutes.post('/deactivate', deactivateAccount);
userRoutes.delete('/', deleteAccount);
