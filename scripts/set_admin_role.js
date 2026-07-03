const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const pool = new Pool({ connectionString });

pool.query(
  'UPDATE "SalesRep" SET role = $1 WHERE email = $2',
  ['admin', 'john@pasalho.com'],
  (err) => {
    if (err) {
      console.error('Error updating role:', err.message || err);
      process.exit(1);
    } else {
      console.log('✓ john@pasalho.com successfully updated to admin role in the database.');
      process.exit(0);
    }
  }
);
