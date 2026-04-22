import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function createAccessToken(userId: string) {
  return jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: '15m',
  });
}

export function createRefreshToken(userId: string, sessionId: string) {
  return jwt.sign({ sub: userId, sid: sessionId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtAccessSecret) as { sub: string; type: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtRefreshSecret) as { sub: string; sid: string; type: string };
}

export function createSessionSecret() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashSessionSecret(secret: string) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}
