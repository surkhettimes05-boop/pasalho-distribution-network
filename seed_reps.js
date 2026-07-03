const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho';
const pool = new Pool({ connectionString });

async function seed() {
  try {
    const plain = 'pass123';
    const hashed = bcrypt.hashSync(plain, 8);

    const reps = [
      ['pasalho-001', 'Ram Shrestha', 'ram@pasalho.com', '9841111111', hashed],
      ['pasalho-001', 'Sita Thapa', 'sita@pasalho.com', '9842222222', hashed],
      ['pasalho-001', 'Hari Gurung', 'hari@pasalho.com', '9843333333', hashed]
    ];

    const values = reps.map((_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`).join(', ');
    const flat = reps.flat();

    const sql = `INSERT INTO "SalesRep" ("distributorId", name, email, phone, password) VALUES ${values} ON CONFLICT DO NOTHING;`;
    await pool.query(sql, flat);

    console.log('✓ Sample sales reps created');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
