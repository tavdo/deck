import { initDatabase } from './pool.js';

async function runMigration() {
  console.log('Running Kartuli Deck AI PostgreSQL database migrations...');
  await initDatabase();
  console.log('Migrations completed successfully.');
  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
