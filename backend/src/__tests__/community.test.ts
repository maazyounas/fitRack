/**
 * community.test.ts
 * Integration tests for the community feed API.
 * Covers: create post, like/unlike, add comment, report post.
 */
import request from 'supertest';
import { app } from '../app';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/testDb';

process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-long-enough';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

const AUTH = '/api/auth';
const COMMUNITY = '/api/community';

const USER_A = { name: 'Alice', email: 'alice@fitrack.test', password: 'AlicePass123!' };
const USER_B = { name: 'Bob',   email: 'bob@fitrack.test',   password: 'BobPass123!' };

let tokenA: string;
let tokenB: string;
let postId: string;

async function registerAndLogin(user: typeof USER_A) {
  await request(app).post(`${AUTH}/register`).send(user);
  const res = await request(app)
    .post(`${AUTH}/login`)
    .send({ identifier: user.email, password: user.password });
  return res.body.accessToken as string;
}

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await disconnectTestDb();
});
beforeEach(async () => {
  tokenA = await registerAndLogin(USER_A);
  tokenB = await registerAndLogin(USER_B);
});
afterEach(async () => {
  await clearTestDb();
});

describe('POST /api/community/posts', () => {
  it('creates a post successfully', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Just hit a new PR on bench press! 💪' });

    expect(res.status).toBe(201);
    expect(res.body.post.content).toContain('bench press');
    postId = res.body.post.id;
  });

  it('rejects empty content', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts`)
      .send({ content: 'ghost post' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/community/posts/:id/like', () => {
  beforeEach(async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Like test post' });
    postId = res.body.post.id;
  });

  it('likes a post', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.post.likeCount).toBe(1);
    expect(res.body.post.likedByMe).toBe(true);
  });

  it('unlikes an already-liked post (toggle)', async () => {
    await request(app)
      .post(`${COMMUNITY}/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);

    const res = await request(app)
      .post(`${COMMUNITY}/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.body.post.likeCount).toBe(0);
    expect(res.body.post.likedByMe).toBe(false);
  });
});

describe('POST /api/community/posts/:id/comments', () => {
  beforeEach(async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Comment test post' });
    postId = res.body.post.id;
  });

  it('adds a comment', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Amazing work!' });

    expect(res.status).toBe(201);
    expect(res.body.post.comments).toHaveLength(1);
    expect(res.body.post.comments[0].content).toBe('Amazing work!');
  });

  it('rejects empty comment', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/community/posts/:id/report', () => {
  beforeEach(async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Reported post' });
    postId = res.body.post.id;
  });

  it('increments reportCount', async () => {
    const res = await request(app)
      .post(`${COMMUNITY}/posts/${postId}/report`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reported/i);
  });
});
