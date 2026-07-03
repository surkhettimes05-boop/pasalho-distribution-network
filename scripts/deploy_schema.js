const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    console.log('[Schema Deploy] Applying setup.sql...');
    const setupSql = fs.readFileSync(path.join(__dirname, '../setup.sql'), 'utf8');
    await client.query(setupSql);

    console.log('[Schema Deploy] Applying add_sales_rep.sql...');
    const addSalesRepSql = fs.readFileSync(path.join(__dirname, '../add_sales_rep.sql'), 'utf8');
    await client.query(addSalesRepSql);

    console.log('[Schema Deploy] Schema successfully deployed to the database!');
  } catch (err) {
    console.error('[Schema Deploy] Error deploying schema:', err.message || err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
