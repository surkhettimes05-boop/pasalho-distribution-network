const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho' });

async function inspect() {
  try {
    const res = await pool.query('SELECT id, email, password, status FROM "SalesRep"');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

inspect();
