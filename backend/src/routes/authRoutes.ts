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
import { asyncHandler } from '../utils/asyncHandler';

export const authRoutes = Router();

authRoutes.post('/register', registerRateLimit, asyncHandler(register));
authRoutes.post('/verify', otpRateLimit, asyncHandler(verifyRegistrationOtp));
authRoutes.post('/resend-otp', resendOtpRateLimit, asyncHandler(resendOtp));
authRoutes.post('/login', loginRateLimit, asyncHandler(login));
authRoutes.post('/refresh', asyncHandler(refreshSession));
authRoutes.post('/forgot-password', forgotPasswordRateLimit, asyncHandler(requestPasswordReset));
authRoutes.post('/reset-password', otpRateLimit, asyncHandler(resetPassword));
authRoutes.post('/logout', asyncHandler(logout));
