import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
