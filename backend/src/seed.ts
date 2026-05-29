import { connectDatabase } from './config/database';
import { seedDevelopmentData } from './services/devSeed';

async function seed() {
  await connectDatabase();
  console.log('Seeding database...');
  await seedDevelopmentData();

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
