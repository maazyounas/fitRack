import mongoose from 'mongoose';
import { env } from './src/config/env';
import { UserModel } from './src/models/User';
import { hashIdentifier, normalizeIdentifier, encryptValue } from './src/utils/crypto';
import { hashPassword, verifyPassword } from './src/utils/password';

async function debugLogin() {
  try {
    // Connect to DB
    await mongoose.connect(env.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await UserModel.find({});
    console.log(`\n📊 Total users in database: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      await mongoose.connection.close();
      return;
    }

    // Display all users
    for (const user of users) {
      console.log('─'.repeat(60));
      console.log(`👤 User ID: ${user.id}`);
      console.log(`   Email (encrypted): ${user.emailEncrypted?.content.slice(0, 20)}...`);
      console.log(`   Email Hash: ${user.emailHash?.slice(0, 20)}...`);
      console.log(`   Phone Hash: ${user.phoneHash?.slice(0, 20) || 'N/A'}...`);
      console.log(`   Password Hash: ${user.passwordHash?.slice(0, 20)}...`);
      console.log(`   Profile Name: ${user.profile?.name}`);
      console.log(`   Verified: Email=${user.verification?.emailVerified}, Phone=${user.verification?.phoneVerified}`);
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n🔍 Testing login process:\n');

    // Test with the first user
    const testUser = users[0];
    const testEmail = decryptValue(testUser.emailEncrypted);
    
    console.log(`Testing with user: ${testEmail}`);
    console.log(`Stored password hash (first 20 chars): ${testUser.passwordHash?.slice(0, 20)}...`);

    // Try different test passwords
    const testPasswords = [
      'Test@123456',
      'test@123456',
      'DemoUser123!',
      'Maazyounas@123',
      'DemoUser@123',
    ];

    for (const testPass of testPasswords) {
      const normalizedInput = normalizeIdentifier(testEmail);
      const hashFromInput = hashIdentifier(testEmail);
      const storedHash = testUser.emailHash;

      console.log(`\n  Testing password: "${testPass}"`);
      console.log(`  Normalized input: ${normalizedInput}`);
      console.log(`  Hash from input:   ${hashFromInput.slice(0, 20)}...`);
      console.log(`  Stored hash:       ${storedHash?.slice(0, 20)}...`);
      console.log(`  Hashes match: ${hashFromInput === storedHash ? '✅ YES' : '❌ NO'}`);

      try {
        const isValidPassword = await verifyPassword(testPass, testUser.passwordHash);
        console.log(`  Password matches: ${isValidPassword ? '✅ YES' : '❌ NO'}`);
      } catch (err) {
        console.log(`  Password error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    console.log('\n' + '─'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

function decryptValue(payload?: { iv: string; content: string; authTag: string } | null) {
  if (!payload) return '[NO ENCRYPTION DATA]';
  try {
    const crypto = require('crypto');
    const key = crypto.createHash('sha256').update(env.fieldEncryptionKey).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.content, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (err) {
    return '[DECRYPTION FAILED]';
  }
}

debugLogin().catch(console.error);
