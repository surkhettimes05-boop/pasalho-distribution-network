const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT');
    await client.query('CREATE INDEX IF NOT EXISTS idx_refreshtoken_hash ON "RefreshToken"("tokenHash")');
    console.log('Added tokenHash column and index to RefreshToken');
  } catch (err) {
    console.error('Error adding tokenHash column:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
