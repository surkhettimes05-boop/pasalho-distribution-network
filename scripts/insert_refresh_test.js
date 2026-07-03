const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function run() {
  try {
    const token = 'test-refresh-token-' + Date.now();
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query("INSERT INTO \"RefreshToken\" (\"tokenHash\", \"repId\", \"expiresAt\") VALUES ($1, $2, NOW() + interval '7 days')", [hash, 4]);
    console.log('Inserted test refresh token hash');
  } catch (e) {
    console.error('Error inserting test refresh token:', e.message || e);
  } finally {
    await pool.end();
  }
}

run();
