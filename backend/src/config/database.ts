import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase() {
  console.log('Connecting to MongoDB...');

  mongoose.connection.on('disconnected', () => {
    console.warn('[WARN] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[ERROR] MongoDB connection error:', err);
  });

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('MongoDB initial connection error:', error);
    throw error;
  }
}
