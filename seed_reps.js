const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho'
});

async function seed() {
  try {
    const plain = 'pass123';
    const hashed = bcrypt.hashSync(plain, 8);

    const reps = [
      ['dist-001', 'John Kipchoge', 'john@pasalho.com', '0712345678', hashed],
      ['dist-001', 'Alice Mwangi', 'alice@pasalho.com', '0723456789', hashed],
      ['dist-001', 'Peter Omondi', 'peter@pasalho.com', '0734567890', hashed]
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
