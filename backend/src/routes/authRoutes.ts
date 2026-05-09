import { Router } from 'express';
import {
  login,
  logout,
  refreshSession,
  register,
  requestPasswordReset,
  resendOtp,
  resetPassword,
  verifyRegistrationOtp,
} from '../controllers/authController';
import {
  forgotPasswordRateLimit,
  loginRateLimit,
  otpRateLimit,
  registerRateLimit,
  resendOtpRateLimit,
} from '../middleware/rateLimit';

export const authRoutes = Router();

authRoutes.post('/register', registerRateLimit, register);
authRoutes.post('/verify', otpRateLimit, verifyRegistrationOtp);
authRoutes.post('/resend-otp', resendOtpRateLimit, resendOtp);
authRoutes.post('/login', loginRateLimit, login);
authRoutes.post('/refresh', refreshSession);
authRoutes.post('/forgot-password', forgotPasswordRateLimit, requestPasswordReset);
authRoutes.post('/reset-password', otpRateLimit, resetPassword);
authRoutes.post('/logout', logout);
