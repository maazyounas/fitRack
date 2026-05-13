import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { createIndexes } from './config/indexes';
import { initializeScheduledJobs } from './services/schedulerService';

async function start() {
  console.log('--- FITRACK BACKEND STARTUP ---');
  try {
    await connectDatabase();
    await createIndexes();
    initializeScheduledJobs();
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`[SUCCESS] Backend listening at http://localhost:${env.port}`);
      console.log(`[SUCCESS] Accessible on network at http://0.0.0.0:${env.port}`);
      console.log(`[INFO] Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error('[FATAL] Backend startup failed!');
    console.error(error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled Rejection:', reason);
});

start();
