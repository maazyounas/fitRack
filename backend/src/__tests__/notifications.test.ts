// Set required env before app initializes
process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

import request from 'supertest';
import { app } from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/testDb';
import { UserModel } from '../models/User';
import { NotificationTokenModel } from '../models/NotificationToken';
import { encryptValue, hashIdentifier } from '../utils/crypto';
import { createAccessToken } from '../utils/tokens';

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('Notification API', () => {
  let token: string;
  let user: any;

  beforeEach(async () => {
    user = await UserModel.create({
      emailEncrypted: encryptValue('test@example.com'),
      emailHash: hashIdentifier('test@example.com'),
      passwordHash: 'hashed_password',
      profile: { name: 'Test User' },
    });
    token = createAccessToken(user._id.toString());
  });

  describe('POST /users/notifications/push-token', () => {
    it('should save a push token successfully', async () => {
      const expoPushToken = 'ExponentPushToken[xxxx-xxxx-xxxx-xxxx]';

      const response = await request(app)
        .post('/api/users/notifications/push-token')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: expoPushToken, deviceType: 'ios' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Push token saved successfully.');

      const savedToken = await NotificationTokenModel.findOne({ userId: user._id });
      expect(savedToken).not.toBeNull();
      expect(savedToken?.expoPushToken).toBe(expoPushToken);
      expect(savedToken?.deviceType).toBe('ios');
    });

    it('should return 400 if token is missing', async () => {
      const response = await request(app)
        .post('/api/users/notifications/push-token')
        .set('Authorization', `Bearer ${token}`)
        .send({ deviceType: 'android' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Token is required.');
    });

    it('should upsert when a new token for the same user is sent', async () => {
      const expoPushToken = 'ExponentPushToken[first-token]';
      await NotificationTokenModel.create({
        userId: user._id,
        expoPushToken,
        deviceType: 'android',
      });

      // User sends the SAME token, it should just update lastUsedAt
      const response1 = await request(app)
        .post('/api/users/notifications/push-token')
        .set('Authorization', `Bearer ${token}`)
        .send({ token: expoPushToken, deviceType: 'ios' });

      expect(response1.status).toBe(200);

      const tokens = await NotificationTokenModel.find({ userId: user._id });
      expect(tokens.length).toBe(1);
      expect(tokens[0].deviceType).toBe('ios'); // Updated from android
    });
  });
});
