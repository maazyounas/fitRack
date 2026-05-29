import request from 'supertest';
import { app } from './src/app';
import { connectTestDb, disconnectTestDb } from './src/__tests__/helpers/testDb';
import { UserModel } from './src/models/User';
import { hashPassword } from './src/utils/password';
import { encryptValue, hashIdentifier } from './src/utils/crypto';

process.env.MONGODB_URI = 'memory';
process.env.JWT_ACCESS_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-secret';
process.env.FIELD_ENCRYPTION_KEY = 'test-32-char-encrypt-key!!!!!!!';

async function run() {
  await connectTestDb();
  await UserModel.deleteMany({});
  
  const passwordHash = await hashPassword('TestPass123!');
  await UserModel.create({
    emailEncrypted: encryptValue('test@test.com'),
    emailHash: hashIdentifier('test@test.com'),
    passwordHash,
    profile: { name: 'Test', dailyCalories: 2000 },
    verification: { emailVerified: true, phoneVerified: false, verifiedAt: new Date() },
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'test@test.com', password: 'TestPass123!' });

  console.log('Login Response:', res.status, res.body);
  
  await disconnectTestDb();
}
run().catch(console.error);
