const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho';

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, password FROM "SalesRep" WHERE password IS NOT NULL');
    let updated = 0;
    for (const row of res.rows) {
      const pw = row.password || '';
      // Skip if already a bcrypt hash
      if (/^\$2[aby]\$\d{2}\$/.test(pw)) continue;

      const hashed = bcrypt.hashSync(pw, 8);
      await client.query('UPDATE "SalesRep" SET password = $1 WHERE id = $2', [hashed, row.id]);
      updated++;
      console.log(`Hashed password for rep id=${row.id}`);
    }

    console.log(`Done. Passwords hashed: ${updated}`);
  } catch (err) {
    console.error('Error hashing passwords:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
