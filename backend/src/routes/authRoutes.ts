import { Router } from 'express';
import {
  login,
  logout,
  refreshSession,
  register,
  requestPasswordReset,
  resetPassword,
  verifyRegistrationOtp,
} from '../controllers/authController';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/verify', verifyRegistrationOtp);
authRoutes.post('/login', login);
authRoutes.post('/refresh', refreshSession);
authRoutes.post('/forgot-password', requestPasswordReset);
authRoutes.post('/reset-password', resetPassword);
authRoutes.post('/logout', logout);
