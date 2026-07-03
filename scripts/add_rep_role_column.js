const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE \"SalesRep\" ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'rep'");
    console.log('Added role column to SalesRep');
  } catch (err) {
    console.error('Error adding role column:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
