/**
 * progress.test.ts
 * Integration tests for the progress tracking API.
 * Covers: log entry, streak update, milestone detection.
 */
import request from 'supertest';
import { app } from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/testDb';

process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

const AUTH = '/api/auth';
const PROGRESS = '/api/progress';

const TEST_USER = { name: 'Gym Rat', email: 'gymrat@fitrack.test', password: 'GymPass123!' };

let accessToken: string;

beforeAll(async () => { await connectTestDb(); });
afterAll(async () => { await disconnectTestDb(); });

beforeEach(async () => {
  await request(app).post(`${AUTH}/register`).send(TEST_USER);
  const res = await request(app)
    .post(`${AUTH}/login`)
    .send({ identifier: TEST_USER.email, password: TEST_USER.password });
  accessToken = res.body.accessToken;
});

afterEach(async () => { await clearTestDb(); });

describe('POST /api/progress', () => {
  it('logs a weight entry successfully', async () => {
    const res = await request(app)
      .post(PROGRESS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ weightKg: 82.5 });

    expect(res.status).toBe(201);
    expect(res.body.entry.weightKg).toBe(82.5);
  });

  it('logs a workout volume entry', async () => {
    const res = await request(app)
      .post(PROGRESS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workoutVolumeKg: 1200,
        exercises: [{ name: 'Bench Press', sets: 4, reps: 8, weightKg: 80 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.entry.workoutVolumeKg).toBe(1200);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post(PROGRESS).send({ weightKg: 75 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/progress/charts', () => {
  beforeEach(async () => {
    // Seed 3 weight entries
    for (const w of [80, 79.5, 79]) {
      await request(app)
        .post(PROGRESS)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ weightKg: w });
    }
  });

  it('returns chart data for weight trend', async () => {
    const res = await request(app)
      .get(`${PROGRESS}/charts`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('weightTrend');
    expect(Array.isArray(res.body.weightTrend)).toBe(true);
  });
});

describe('POST /api/progress/streak', () => {
  it('initialises or increments the daily streak', async () => {
    const res = await request(app)
      .post(`${PROGRESS}/streak`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.streak).toBe('number');
    expect(res.body.streak).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/progress/milestones', () => {
  it('returns an array of achievement objects', async () => {
    const res = await request(app)
      .get(`${PROGRESS}/milestones`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.milestones)).toBe(true);
  });
});
