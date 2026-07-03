const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_AwCtYLEkgu98@ep-patient-king-atznc2fp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

console.log('Testing connection to Neon database...');
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('✗ Connection failed:', err.message || err);
  } else {
    console.log('✓ Connection successful! Database time:', res.rows[0].now);
  }
  pool.end();
});
