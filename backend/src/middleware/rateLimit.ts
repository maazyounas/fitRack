import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isDevelopment = env.nodeEnv !== 'production';

const skipInDevelopment = () => isDevelopment;

/** 5 login attempts per 15 minutes per IP */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
  skip: skipInDevelopment,
});

/** 3 registrations per hour per IP */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again in an hour.' },
  skip: skipInDevelopment,
});

/** 3 password-reset requests per hour per IP */
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again in an hour.' },
  skip: skipInDevelopment,
});

/** 10 OTP verifications per 15 minutes per IP */
export const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP attempts. Please try again in 15 minutes.' },
  skip: skipInDevelopment,
});

/** 5 OTP resend requests per hour per IP */
export const resendOtpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many resend OTP requests. Please try again later.' },
  skip: skipInDevelopment,
});
