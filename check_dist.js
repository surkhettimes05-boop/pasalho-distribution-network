const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho'
});

pool.query('SELECT * FROM "Distributor" LIMIT 5;').then(res => {
  console.log('Distributors:', res.rows);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
