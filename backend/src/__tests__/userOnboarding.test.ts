/**
 * userOnboarding.test.ts
 * Verifies onboarding completion is stored on the authenticated user's profile.
 */
import request from 'supertest';
import { app } from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/testDb';
import { UserModel } from '../models/User';
import { createAccessToken } from '../utils/tokens';

process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

describe('User onboarding profile flag', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  it('stores onboarding completion on the user profile and exposes it via /api/users/me', async () => {
    const user = await UserModel.create({
      passwordHash: 'hashed-password',
      profile: { name: 'Onboarding User' },
    });

    const accessToken = createAccessToken(String(user.id));

    const initialMe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(initialMe.status).toBe(200);
    expect(initialMe.body.user.profile.onboardingCompleted).toBe(false);

    const onboardingRes = await request(app)
      .put('/api/users/onboarding')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        gender: 'male',
        heightCm: 180,
        weightKg: 82,
        age: 28,
        primaryGoal: 'general_fitness',
        workoutFrequencyPerWeek: 3,
        onboardingCompleted: true,
      });

    expect(onboardingRes.status).toBe(200);
    expect(onboardingRes.body.user.profile.onboardingCompleted).toBe(true);
    expect(onboardingRes.body.user.onboardingCompleted).toBe(true);

    const updatedMe = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(updatedMe.status).toBe(200);
    expect(updatedMe.body.user.profile.onboardingCompleted).toBe(true);
  });
});