import { Request, Response } from 'express';
import { env } from '../config/env';
import { OtpTokenModel } from '../models/OtpToken';
import { PendingRegistrationModel } from '../models/PendingRegistration';
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

const ADMIN_EMAIL = 'maazyounas@gmail.com';
const ADMIN_PASSWORD = 'Maazyounas@123';
const ADMIN_NAME = 'FITRACK Admin';

async function createAuthSession(user: any, req: Request) {
  const sessionSecret = createSessionSecret();
  const session = await SessionModel.create({
    userId: user.id,
    tokenHash: hashSessionSecret(sessionSecret),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  return {
    sessionSecret,
    accessToken: createAccessToken(user.id),
    refreshToken: createRefreshToken(user.id, session.id),
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

  // Debug logging: capture incoming register attempts (dev only)
  try {
    // eslint-disable-next-line no-console
    console.log('Register attempt:', JSON.stringify({
      ts: new Date().toISOString(),
      ip: req.ip,
      xForwardedFor: req.headers['x-forwarded-for'],
      body: { email: email ?? null, phone: phone ?? null, name: name ?? null },
    }));
  } catch (e) {
    // ignore logging failures
  }

  if ((!email && !phone) || !password || !name) {
    throw new HttpError(400, 'Name, password, and either email or phone are required.');
  }

  validatePasswordStrength(password);

  const emailHash = email ? hashIdentifier(email) : undefined;
  const phoneHash = phone ? hashIdentifier(phone) : undefined;

  if (emailHash === hashIdentifier(ADMIN_EMAIL)) {
    throw new HttpError(409, 'This email is reserved for admin access.');
  }

  if (emailHash) {
    const existingEmail = await UserModel.findOne({ emailHash });
    if (existingEmail) {
      throw new HttpError(409, 'Email is already registered.');
    }
  }

  if (phoneHash) {
    const existingPhone = await UserModel.findOne({ phoneHash });
    if (existingPhone) {
      throw new HttpError(409, 'Phone number is already registered.');
    }
  }

  const pendingMatchFilters: Array<Record<string, string>> = [];
  if (emailHash) pendingMatchFilters.push({ emailHash });
  if (phoneHash) pendingMatchFilters.push({ phoneHash });

  const pending = await PendingRegistrationModel.findOneAndUpdate(
    pendingMatchFilters.length > 0 ? { $or: pendingMatchFilters } : {},
    {
      $set: {
        emailEncrypted: email ? encryptValue(normalizeIdentifier(email)) : undefined,
        emailHash,
        phoneEncrypted: phone ? encryptValue(normalizeIdentifier(phone)) : undefined,
        phoneHash,
        passwordHash: await hashPassword(password),
        name: name.trim(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  const debugOtp: { email?: string; phone?: string } = {};

  await OtpTokenModel.updateMany(
    {
      userId: pending.id,
      purpose: { $in: ['verify-email', 'verify-phone'] },
      consumedAt: { $exists: false },
    },
    { $set: { consumedAt: new Date() } }
  );

  if (email) {
    const otp = await createOtp(pending.id, 'verify-email');
    debugOtp.email = otp;
    const emailOtpResult = await sendOtpNotification(email, otp, 'verify-email');
    if (!emailOtpResult.success) {
      if (env.nodeEnv === 'production') {
        throw new HttpError(502, `Could not send email OTP: ${emailOtpResult.message}`);
      }

      console.warn('[AUTH] Email OTP delivery failed in development, continuing with debug OTP.', emailOtpResult.message);
    }
  }

  if (phone) {
    const otp = await createOtp(pending.id, 'verify-phone');
    debugOtp.phone = otp;
    const phoneOtpResult = await sendOtpNotification(phone, otp, 'verify-phone');
    if (!phoneOtpResult.success) {
      if (env.nodeEnv === 'production') {
        throw new HttpError(502, `Could not send phone OTP: ${phoneOtpResult.message}`);
      }

      console.warn('[AUTH] Phone OTP delivery failed in development, continuing with debug OTP.', phoneOtpResult.message);
    }
  }

  res.status(201).json({
    message: 'OTP sent. Verify your email or phone to complete registration.',
    ...(env.nodeEnv !== 'production' ? { debugOtp } : {}),
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
  const pending = await PendingRegistrationModel.findOne(
    purpose === 'verify-email' ? { emailHash: identifierHash } : { phoneHash: identifierHash }
  );

  if (pending) {
    const record = await OtpTokenModel.findOne({
      userId: pending.id,
      purpose,
      consumedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    if (!record || isOtpExpired(record.expiresAt) || record.otpHash !== hashOtp(otp)) {
      throw new HttpError(400, 'Invalid or expired OTP.');
    }

    const existingUserFilters: Array<Record<string, string>> = [];
    if (pending.emailHash) existingUserFilters.push({ emailHash: pending.emailHash });
    if (pending.phoneHash) existingUserFilters.push({ phoneHash: pending.phoneHash });

    const existingUser = existingUserFilters.length
      ? await UserModel.findOne({ $or: existingUserFilters })
      : null;
    if (existingUser) {
      throw new HttpError(409, 'Account already exists for this email/phone.');
    }

    const user = await UserModel.create({
      emailEncrypted: pending.emailEncrypted,
      emailHash: pending.emailHash,
      phoneEncrypted: pending.phoneEncrypted,
      phoneHash: pending.phoneHash,
      passwordHash: pending.passwordHash,
      isAdmin: false,
      profile: {
        name: pending.name,
        dailyCalories: calculateDailyCalories({}),
      },
      verification: {
        emailVerified: purpose === 'verify-email',
        phoneVerified: purpose === 'verify-phone',
        verifiedAt: new Date(),
      },
    });

    record.consumedAt = new Date();
    await record.save();
    await OtpTokenModel.deleteMany({ userId: pending.id });
    await PendingRegistrationModel.findByIdAndDelete(pending.id);

    res.json({ message: 'Verification successful. Account created.', user: buildUserResponse(user) });
    return;
  }

  // Backward compatibility for already-created unverified users.
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
  const pending = await PendingRegistrationModel.findOne(
    purpose === 'verify-email' ? { emailHash: identifierHash } : { phoneHash: identifierHash }
  );

  if (pending) {
    await OtpTokenModel.updateMany(
      { userId: pending.id, purpose, consumedAt: { $exists: false } },
      { $set: { consumedAt: new Date() } }
    );

    const otp = await createOtp(pending.id, purpose);
    const otpResult = await sendOtpNotification(identifier, otp, purpose);
    if (!otpResult.success) {
      if (env.nodeEnv === 'production') {
        throw new HttpError(502, `Could not resend OTP: ${otpResult.message}`);
      }

      console.warn('[AUTH] OTP resend failed in development, continuing with debug OTP.', otpResult.message);
    }

    res.json({
      message: 'If the account exists and is unverified, a new OTP has been sent.',
      ...(env.nodeEnv !== 'production' ? { debugOtp: otp } : {}),
    });
    return;
  }

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
  const otpResult = await sendOtpNotification(identifier, otp, purpose);
  if (!otpResult.success) {
    if (env.nodeEnv === 'production') {
      throw new HttpError(502, `Could not resend OTP: ${otpResult.message}`);
    }

    console.warn('[AUTH] OTP resend failed in development, continuing with debug OTP.', otpResult.message);
  }

  res.json({
    message: 'If the account exists and is unverified, a new OTP has been sent.',
    ...(env.nodeEnv !== 'production' ? { debugOtp: otp } : {}),
  });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body as { identifier?: string; password?: string };

  if (!identifier || !password) {
    throw new HttpError(400, 'Identifier and password are required.');
  }

  // Debug logging for login attempts (dev only)
  try {
    if (env.nodeEnv !== 'production') {
      console.log('[AUTH] Login attempt:', JSON.stringify({
        ts: new Date().toISOString(),
        ip: req.ip,
        identifier: identifier ? identifier.substring(0, 3) + '***' : null,
      }));
    }
  } catch (e) {
    // ignore logging failures
  }

  const normalizedIdentifier = normalizeIdentifier(identifier);
  const identifierHash = hashIdentifier(identifier);
  const adminHash = hashIdentifier(ADMIN_EMAIL);
  const isAdminMasterLogin = normalizedIdentifier === normalizeIdentifier(ADMIN_EMAIL) && password === ADMIN_PASSWORD;

  let user = await UserModel.findOne({
    $or: [{ emailHash: identifierHash }, { phoneHash: identifierHash }],
  });

  if (isAdminMasterLogin) {
    if (!user || user.emailHash !== adminHash) {
      user = await UserModel.findOne({ emailHash: adminHash });
    }

    if (!user) {
      user = await UserModel.create({
        emailEncrypted: encryptValue(normalizeIdentifier(ADMIN_EMAIL)),
        emailHash: adminHash,
        passwordHash: await hashPassword(ADMIN_PASSWORD),
        isAdmin: true,
        profile: {
          name: ADMIN_NAME,
          dailyCalories: calculateDailyCalories({}),
        },
        verification: {
          emailVerified: true,
          phoneVerified: false,
          verifiedAt: new Date(),
        },
      });
    } else if (!user.isAdmin) {
      user.isAdmin = true;
      user.passwordHash = await hashPassword(ADMIN_PASSWORD);
      await user.save();
    }
  }

  if (!user) {
    if (env.nodeEnv !== 'production') {
      console.warn('[AUTH] Login failed: user not found for identifier hash', identifierHash.slice(0, 8) + '...');
    }
    throw new HttpError(401, 'Invalid credentials.');
  }

  if (user.deactivatedAt) {
    if (env.nodeEnv !== 'production') {
      console.warn('[AUTH] Login failed: account deactivated for user', user.id);
    }
    throw new HttpError(403, 'Account is deactivated.');
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    if (env.nodeEnv !== 'production') {
      console.warn('[AUTH] Login failed: account locked until', user.lockUntil, 'for user', user.id);
    }
    throw new HttpError(423, 'Account is temporarily locked due to failed login attempts.');
  }

  const validPassword = isAdminMasterLogin
    ? true
    : await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    if (env.nodeEnv !== 'production') {
      console.warn('[AUTH] Login failed: wrong password for user', user.id, '(attempts:', user.failedLoginAttempts + 1, ')');
    }
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      if (env.nodeEnv !== 'production') {
        console.warn('[AUTH] Account locked for 15 minutes for user', user.id);
      }
    }
    await user.save();
    throw new HttpError(401, 'Invalid credentials.');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken, sessionSecret } = await createAuthSession(user, req);

  if (env.nodeEnv !== 'production') {
    console.log('[AUTH] Login successful for user', user.id, '(', (user as any).profile?.name, ')');
  }

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
  const otpResult = await sendOtpNotification(identifier, otp, 'password-reset');
  if (!otpResult.success) {
    throw new HttpError(502, `Could not send password reset OTP: ${otpResult.message}`);
  }

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
