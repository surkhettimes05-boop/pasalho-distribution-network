const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho';
const pool = new Pool({ connectionString });

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'add_indexes.sql'), 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Indexes created/verified');
  } catch (err) {
    console.error('Error applying indexes:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
