import { Server } from 'http';
import mongoose from 'mongoose';
import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { createIndexes } from './config/indexes';
import { initializeScheduledJobs } from './services/schedulerService';
import { listenOnAvailablePort } from './utils/port';

let server: Server;

async function start() {
  console.log('--- FITRACK BACKEND STARTUP ---');
  try {
    await connectDatabase();
    await createIndexes();
    initializeScheduledJobs();
    const listening = await listenOnAvailablePort((port, host) => app.listen(port, host), env.port);
    server = listening.server;
    console.log(`[SUCCESS] Backend listening at http://localhost:${listening.port}`);
    console.log(`[SUCCESS] Accessible on network at http://${listening.host}:${listening.port}`);
    console.log(`[INFO] Environment: ${env.nodeEnv}`);
  } catch (error) {
    console.error('[FATAL] Backend startup failed!');
    console.error(error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\n[INFO] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('[INFO] HTTP server closed.');
    });
  }
  try {
    await mongoose.connection.close();
    console.log('[INFO] MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Error during MongoDB disconnection:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled Rejection:', reason);
});

start();
