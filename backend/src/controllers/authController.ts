import { Request, Response } from 'express';
import { OtpTokenModel } from '../models/OtpToken';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';
import {
  sendOtpNotification,
  sendPasswordChangedNotification,
} from '../services/notificationService';
import { calculateDailyCalories } from '../utils/calories';
import { decryptValue, encryptValue, hashIdentifier, normalizeIdentifier } from '../utils/crypto';
import { HttpError } from '../utils/http';
import { generateOtp, hashOtp, isOtpExpired } from '../utils/otp';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../utils/password';
import {
  createAccessToken,
  createRefreshToken,
  createSessionSecret,
  hashSessionSecret,
  verifyRefreshToken,
} from '../utils/tokens';

function buildUserResponse(user: any) {
  return {
    id: user.id,
    isAdmin: Boolean(user.isAdmin),
    email: decryptValue(user.emailEncrypted),
    phone: decryptValue(user.phoneEncrypted),
    profile: user.profile,
    preferences: user.preferences,
    verification: user.verification,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createOtp(userId: string, purpose: 'verify-email' | 'verify-phone' | 'password-reset') {
  const otp = generateOtp();
  await OtpTokenModel.create({
    userId,
    purpose,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return otp;
}

export async function register(req: Request, res: Response) {
  const { email, phone, password, name } = req.body as {
    email?: string;
    phone?: string;
    password?: string;
    name?: string;
  };

  if ((!email && !phone) || !password || !name) {
    throw new HttpError(400, 'Name, password, and either email or phone are required.');
  }

  validatePasswordStrength(password);

  const emailHash = email ? hashIdentifier(email) : undefined;
  const phoneHash = phone ? hashIdentifier(phone) : undefined;
  const userCount = await UserModel.countDocuments();
  const existingUser = await UserModel.findOne({
    $or: [{ emailHash }, { phoneHash }].filter((entry) => Object.values(entry)[0]),
  });

  if (existingUser) {
    throw new HttpError(409, 'Email or phone is already registered.');
  }

  const user = await UserModel.create({
    emailEncrypted: email ? encryptValue(normalizeIdentifier(email)) : undefined,
    emailHash,
    phoneEncrypted: phone ? encryptValue(phone.trim()) : undefined,
    phoneHash,
    passwordHash: await hashPassword(password),
    isAdmin: userCount === 0,
    profile: {
      name: name.trim(),
      dailyCalories: calculateDailyCalories({}),
    },
  });

  if (email) {
    const otp = await createOtp(user.id, 'verify-email');
    await sendOtpNotification(email, otp, 'verify-email');
  }

  if (phone) {
    const otp = await createOtp(user.id, 'verify-phone');
    await sendOtpNotification(phone, otp, 'verify-phone');
  }

  res.status(201).json({
    message: 'Account created. Verify your email or phone with the OTP sent.',
    user: buildUserResponse(user),
  });
}

export async function verifyRegistrationOtp(req: Request, res: Response) {
  const { identifier, otp, purpose } = req.body as {
    identifier?: string;
    otp?: string;
    purpose?: 'verify-email' | 'verify-phone';
  };

  if (!identifier || !otp || !purpose) {
    throw new HttpError(400, 'Identifier, OTP, and purpose are required.');
  }

  const identifierHash = hashIdentifier(identifier);
  const user = await UserModel.findOne(
    purpose === 'verify-email' ? { emailHash: identifierHash } : { phoneHash: identifierHash }
  );

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const record = await OtpTokenModel.findOne({
    userId: user.id,
    purpose,
    consumedAt: { $exists: false },
  }).sort({ createdAt: -1 });

  if (!record || isOtpExpired(record.expiresAt) || record.otpHash !== hashOtp(otp)) {
    throw new HttpError(400, 'Invalid or expired OTP.');
  }

  record.consumedAt = new Date();
  await record.save();
  user.verification = user.verification ?? {
    emailVerified: false,
    phoneVerified: false,
  };

  if (purpose === 'verify-email') {
    user.verification.emailVerified = true;
  } else {
    user.verification.phoneVerified = true;
  }

  user.verification.verifiedAt = new Date();
  await user.save();

  res.json({ message: 'Verification successful.' });
}

export async function resendOtp(req: Request, res: Response) {
  const { identifier, purpose } = req.body as {
    identifier?: string;
    purpose?: 'verify-email' | 'verify-phone';
  };

  if (!identifier || !purpose) {
    throw new HttpError(400, 'Identifier and purpose are required.');
  }

  const identifierHash = hashIdentifier(identifier);
  const user = await UserModel.findOne(
    purpose === 'verify-email' ? { emailHash: identifierHash } : { phoneHash: identifierHash }
  );

  // Always respond the same way regardless of whether user exists (security)
  if (!user) {
    res.json({ message: 'If the account exists and is unverified, a new OTP has been sent.' });
    return;
  }

  const alreadyVerified =
    (purpose === 'verify-email' && user.verification?.emailVerified) ||
    (purpose === 'verify-phone' && user.verification?.phoneVerified);

  if (alreadyVerified) {
    res.json({ message: 'This contact method is already verified.' });
    return;
  }

  // Invalidate old OTP tokens for this user/purpose
  await OtpTokenModel.updateMany(
    { userId: user.id, purpose, consumedAt: { $exists: false } },
    { $set: { consumedAt: new Date() } }
  );

  const otp = await createOtp(user.id, purpose);
  await sendOtpNotification(identifier, otp, purpose);

  res.json({ message: 'If the account exists and is unverified, a new OTP has been sent.' });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier || !password) {
    throw new HttpError(400, 'Identifier and password are required.');
  }

  const identifierHash = hashIdentifier(identifier);
  const user = await UserModel.findOne({
    $or: [{ emailHash: identifierHash }, { phoneHash: identifierHash }],
  });

  if (!user) {
    throw new HttpError(401, 'Invalid credentials.');
  }

  if (user.deactivatedAt) {
    throw new HttpError(403, 'Account is deactivated.');
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    throw new HttpError(423, 'Account is temporarily locked due to failed login attempts.');
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    throw new HttpError(401, 'Invalid credentials.');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const sessionSecret = createSessionSecret();
  const session = await SessionModel.create({
    userId: user.id,
    tokenHash: hashSessionSecret(sessionSecret),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id, session.id);

  res.json({
    message: 'Login successful.',
    accessToken,
    refreshToken,
    sessionSecret,
    user: buildUserResponse(user),
  });
}

export async function refreshSession(req: Request, res: Response) {
  const { refreshToken, sessionSecret } = req.body as { refreshToken?: string; sessionSecret?: string };

  if (!refreshToken || !sessionSecret) {
    throw new HttpError(400, 'Refresh token and session secret are required.');
  }

  const payload = verifyRefreshToken(refreshToken);
  const session = await SessionModel.findById(payload.sid);

  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
    throw new HttpError(401, 'Session expired.');
  }

  if (session.tokenHash !== hashSessionSecret(sessionSecret)) {
    throw new HttpError(401, 'Session secret mismatch.');
  }

  session.lastActivityAt = new Date();
  await session.save();

  res.json({
    accessToken: createAccessToken(payload.sub),
    refreshToken: createRefreshToken(payload.sub, session.id),
  });
}

export async function requestPasswordReset(req: Request, res: Response) {
  const { identifier } = req.body as { identifier?: string };

  if (!identifier) {
    throw new HttpError(400, 'Identifier is required.');
  }

  const identifierHash = hashIdentifier(identifier);
  const user = await UserModel.findOne({
    $or: [{ emailHash: identifierHash }, { phoneHash: identifierHash }],
  });

  if (!user) {
    res.json({ message: 'If the account exists, an OTP has been sent.' });
    return;
  }

  const otp = await createOtp(user.id, 'password-reset');
  await sendOtpNotification(identifier, otp, 'password-reset');

  res.json({ message: 'If the account exists, an OTP has been sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  const { identifier, otp, newPassword } = req.body as {
    identifier?: string;
    otp?: string;
    newPassword?: string;
  };

  if (!identifier || !otp || !newPassword) {
    throw new HttpError(400, 'Identifier, OTP, and new password are required.');
  }

  validatePasswordStrength(newPassword);

  const identifierHash = hashIdentifier(identifier);
  const user = await UserModel.findOne({
    $or: [{ emailHash: identifierHash }, { phoneHash: identifierHash }],
  });

  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  const record = await OtpTokenModel.findOne({
    userId: user.id,
    purpose: 'password-reset',
    consumedAt: { $exists: false },
  }).sort({ createdAt: -1 });

  if (!record || isOtpExpired(record.expiresAt) || record.otpHash !== hashOtp(otp)) {
    throw new HttpError(400, 'Invalid or expired OTP.');
  }

  record.consumedAt = new Date();
  await record.save();

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  const notificationTarget =
    decryptValue(user.emailEncrypted ?? undefined) || decryptValue(user.phoneEncrypted ?? undefined);
  await sendPasswordChangedNotification(notificationTarget);
  await SessionModel.deleteMany({ userId: user.id });

  res.json({ message: 'Password updated successfully.' });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.json({ message: 'Logged out.' });
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  await SessionModel.findByIdAndUpdate(payload.sid, { $set: { revokedAt: new Date() } });
  res.json({ message: 'Logged out.' });
}
