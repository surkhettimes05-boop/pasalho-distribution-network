const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('ALTER TABLE "RefreshToken" ALTER COLUMN token DROP NOT NULL');
    console.log('Altered RefreshToken.token to be nullable');
  } catch (e) {
    console.error('Error altering RefreshToken schema:', e.message || e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
