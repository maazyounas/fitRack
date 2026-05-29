import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app';
import { UserModel } from '../src/models/User';
import { encryptValue, hashIdentifier } from '../src/utils/crypto';
import { hashPassword } from '../src/utils/password';

async function main() {
  process.env.MONGODB_URI = 'memory';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sim-access-secret-1234567890';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sim-refresh-secret-1234567890';
  process.env.FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || 'test-32-char-encrypt-key!!!!!!!';

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Create test user directly
  const TEST_USER = { name: 'SimUser', email: 'simuser@fitrack.test', password: 'SimPass123!' };
  const passwordHash = await hashPassword(TEST_USER.password);
  await UserModel.create({
    emailEncrypted: encryptValue(TEST_USER.email),
    emailHash: hashIdentifier(TEST_USER.email),
    passwordHash,
    profile: { name: TEST_USER.name, dailyCalories: 2000 },
    verification: { emailVerified: true, phoneVerified: false, verifiedAt: new Date() },
  } as any);

  // Login to get access token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ identifier: TEST_USER.email, password: TEST_USER.password });

  const accessToken = loginRes.body.accessToken;
  if (!accessToken) {
    console.error('Login failed', loginRes.status, loginRes.body);
    process.exit(1);
  }

  console.log('Authenticated, creating workout...');

  const payload = {
    name: 'Sim Plan',
    description: 'Created by simulateCreateWorkout script',
    difficulty: 'beginner',
    estimatedDurationMinutes: 30,
    exercises: [
      { name: 'Sim Squat', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 10, restSeconds: 60, notes: '', intensity: 'moderate', order: 1, _id: 'local-12345' },
    ],
  };

  const createRes = await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(payload);

  console.log('Create response status:', createRes.status);
  console.log('Create body:', createRes.body);

  const listRes = await request(app)
    .get('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`);

  console.log('List response status:', listRes.status);
  console.log('List body:', JSON.stringify(listRes.body, null, 2));

  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

main().catch((err) => {
  console.error('Simulation failed', err);
  process.exit(1);
});
