import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from './models/User';
import { connectDatabase } from './config/database';
import { encryptValue } from './utils/crypto';
import crypto from 'crypto';

async function seed() {
  await connectDatabase();
  console.log('Seeding database...');

  const adminEmail = 'maazyounas@gmail.com';
  const adminPassword = 'Maazyounas@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const emailHash = crypto.createHash('sha256').update(adminEmail).digest('hex');

  const existing = await UserModel.findOne({ emailHash });
  if (existing) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  const adminUser = new UserModel({
    emailEncrypted: encryptValue(adminEmail),
    emailHash,
    passwordHash,
    profile: {
      name: 'FITRACK Admin',
      age: 30,
      gender: 'other',
    },
    isAdmin: true,
    verification: {
      emailVerified: true,
      phoneVerified: true,
      verifiedAt: new Date(),
    },
  });

  await adminUser.save();
  console.log('Admin user created successfully.');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
