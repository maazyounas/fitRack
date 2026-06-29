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
let sessionSecret: string;

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

async function registerAndVerifyUser() {
  const registerRes = await request(app).post(`${BASE}/register`).send(TEST_USER);
  const otp = registerRes.body.debugOtp.email;
  await request(app)
    .post(`${BASE}/verify`)
    .send({ identifier: TEST_USER.email, otp, purpose: 'verify-email' });
}

describe('POST /api/auth/register', () => {
  it('sends an OTP to verify the registration', async () => {
    const res = await request(app).post(`${BASE}/register`).send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('debugOtp');
    expect(res.body.message).toContain('OTP sent');
  });

  it('rejects duplicate email', async () => {
    await registerAndVerifyUser();
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
    await registerAndVerifyUser();
  });

  it('returns tokens for valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: TEST_USER.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: 'nobody@fitrack.test', password: 'anything' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    await registerAndVerifyUser();
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: TEST_USER.email, password: TEST_USER.password });
    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
    sessionSecret = loginRes.body.sessionSecret;
  });

  it('issues a new access token with a valid refresh token and session secret', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken, sessionSecret });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rejects an invalid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: 'bad-token', sessionSecret });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/users/me', () => {
  beforeEach(async () => {
    await registerAndVerifyUser();
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: TEST_USER.email, password: TEST_USER.password });
    accessToken = loginRes.body.accessToken;
  });

  it('returns the authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.profile.name).toBe(TEST_USER.name);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('Account deactivation and reactivation flow', () => {
  beforeEach(async () => {
    await registerAndVerifyUser();
  });

  it('reactivates a deactivated account upon successful login', async () => {
    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: TEST_USER.email, password: TEST_USER.password });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.accessToken;

    const deactivateRes = await request(app)
      .post('/api/users/deactivate')
      .set('Authorization', `Bearer ${token}`);
    expect(deactivateRes.status).toBe(200);

    // Trying to access user profile should fail now
    const meRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(401);

    // Logging in again with valid credentials should succeed and reactivate the account
    const reloginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ identifier: TEST_USER.email, password: TEST_USER.password });
    expect(reloginRes.status).toBe(200);
    const newToken = reloginRes.body.accessToken;

    // Trying to access user profile now should succeed
    const newMeRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${newToken}`);
    expect(newMeRes.status).toBe(200);
    expect(newMeRes.body.user.profile.name).toBe(TEST_USER.name);
  });
});
