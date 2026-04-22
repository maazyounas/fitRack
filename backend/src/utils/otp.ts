import crypto from 'crypto';

export function generateOtp() {
  return `${crypto.randomInt(100000, 999999)}`;
}

export function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function isOtpExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}
