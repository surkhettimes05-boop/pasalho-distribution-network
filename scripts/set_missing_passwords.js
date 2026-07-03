const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function run() {
  try {
    const res = await pool.query('SELECT id, email FROM "SalesRep" WHERE password IS NULL OR password = \'' + "" + '\'');
    const rows = res.rows;
    const plain = process.env.NEW_PASS || 'pass123';
    for (const r of rows) {
      const hashed = bcrypt.hashSync(plain, 8);
      await pool.query('UPDATE "SalesRep" SET password = $1 WHERE id = $2', [hashed, r.id]);
      console.log('Updated', r.email);
    }
    console.log('Done');
  } catch (e) {
    console.error('Error', e.message || e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
