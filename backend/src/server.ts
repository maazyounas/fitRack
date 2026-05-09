import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { createIndexes } from './config/indexes';
import { initializeScheduledJobs } from './services/schedulerService';

async function start() {
  await connectDatabase();
  await createIndexes();
  initializeScheduledJobs();
  app.listen(env.port, () => {
    console.log(`FITRACK backend running on port ${env.port} [${env.nodeEnv}]`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
