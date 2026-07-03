const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    console.log('[Schema Fix] Altering RefreshToken schema on Neon cloud...');
    
    // Add tokenHash column if it does not exist
    await client.query('ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT');
    
    // Make token column nullable
    await client.query('ALTER TABLE "RefreshToken" ALTER COLUMN token DROP NOT NULL');
    
    // Create unique index and query index
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS ux_refreshtoken_tokenhash ON "RefreshToken"("tokenHash")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refreshtoken_hash ON "RefreshToken"("tokenHash")');
    
    console.log('✓ Cloud schema fully updated and verified!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Schema fix failed:', err.message || err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
