const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS ux_refreshtoken_tokenhash ON "RefreshToken"("tokenHash")');
    console.log('Created unique index on RefreshToken.tokenHash');
  } catch (e) {
    console.error('Error creating unique index:', e.message || e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
