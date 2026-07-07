const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'pkdon123',
  database: 'pasalho'
});
pool.query('SELECT id, name, email, role, status FROM "SalesRep"').then(res => { console.table(res.rows); pool.end(); }).catch(e => { console.error(e); pool.end(); });
