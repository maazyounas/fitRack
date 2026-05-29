import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

async function main() {
  // Start an in-memory MongoDB and set env vars before importing the app
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-1234567890';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-1234567890';
  process.env.FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY || 'test-32-char-encrypt-key!!!!!!!';
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.PORT = process.env.PORT || '4000';

  // Now import the app (which reads env at module load)
  const { app } = await import('../src/app');
  const { connectDatabase } = await import('../src/config/database');
  const { createIndexes } = await import('../src/config/indexes');
  const { initializeScheduledJobs } = await import('../src/services/schedulerService');
  const { seedDevelopmentData } = await import('../src/services/devSeed');

  try {
    await connectDatabase();
    await createIndexes();
    await seedDevelopmentData();
    initializeScheduledJobs();

    const port = Number(process.env.PORT || 4000);
    const server = app.listen(port, '0.0.0.0', () => {
      // eslint-disable-next-line no-console
      console.log(`Memory-backed server listening at http://localhost:${port}`);
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down memory-backed server...');
      server.close();
      await mongoose.connection.close();
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start memory-backed server', err);
    await mongod.stop();
    process.exit(1);
  }
}

main();
