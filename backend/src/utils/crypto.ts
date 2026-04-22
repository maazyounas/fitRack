import crypto from 'crypto';
import { env } from '../config/env';

const algorithm = 'aes-256-gcm';
const encryptionKey = crypto
  .createHash('sha256')
  .update(env.fieldEncryptionKey)
  .digest();

export function encryptValue(value: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptValue(payload?: {
  iv: string;
  content: string;
  authTag: string;
} | null) {
  if (!payload) {
    return '';
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    encryptionKey,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export function hashIdentifier(value: string) {
  return crypto
    .createHash('sha256')
    .update(normalizeIdentifier(value))
    .digest('hex');
}
