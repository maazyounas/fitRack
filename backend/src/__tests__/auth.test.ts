/**
 * auth.test.ts
 * Integration tests for the authentication flow.
 * Covers: register → login → refresh token → logout
 */
import request from 'supertest';
import { app } from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/testDb';

// Set required env before app initializes
process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

const BASE = '/api/auth';

const TEST_USER = {
  name: 'Test User',
  email: 'testuser@fitrack.test',
  password: 'StrongPass123!',
};

let accessToken: string;
let refreshToken: string;

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

describe('POST /api/auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app).post(`${BASE}/register`).send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.profile.name).toBe(TEST_USER.name);
  });

  it('rejects duplicate email', async () => {
    await request(app).post(`${BASE}/register`).send(TEST_USER);
    const res = await request(app).post(`${BASE}/register`).send(TEST_USER);

    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ ...TEST_USER, password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(TEST_USER);
  });

  it('returns tokens for valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@fitrack.test', password: 'anything' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(TEST_USER);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
  });

  it('issues a new access token with a valid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rejects an invalid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: 'bad-token' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(TEST_USER);
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    accessToken = loginRes.body.accessToken;
  });

  it('returns the authenticated user profile', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.profile.name).toBe(TEST_USER.name);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });
});
