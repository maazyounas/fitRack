import { Router } from 'express';
import {
  deactivateAccount,
  deleteAccount,
  getMe,
  updatePreferences,
  updateProfile,
} from '../controllers/userController';
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
userRoutes.patch('/preferences', updatePreferences);
userRoutes.get('/image-consent', getImageConsent);
userRoutes.patch('/image-consent', updateImageConsent);
userRoutes.post('/image-consent/revoke', revokeImageConsent);
userRoutes.delete('/image-consent/images', deleteStoredImages);
userRoutes.post('/deactivate', deactivateAccount);
userRoutes.delete('/', deleteAccount);
