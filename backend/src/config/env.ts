import dotenv from 'dotenv';

dotenv.config();

const required = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FIELD_ENCRYPTION_KEY',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongodbUri: process.env.MONGODB_URI as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY as string,
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:8081',
};
