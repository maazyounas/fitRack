import { app } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';

async function start() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`FITRACK backend running on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
