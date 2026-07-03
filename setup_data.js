const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:pkdon123@localhost:5432/pasalho'
});

async function setup() {
  try {
    // Create Pasalho distributor
    await pool.query(`
      INSERT INTO "Distributor" (id, name, location, "pricingTier")
      VALUES ('pasalho-001', 'Pasalho Distribution Network', 'Nairobi', 'premium')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Distributor created');

    // Create sales reps
    const bcrypt = require('bcryptjs');
    const plain = 'pass123';
    const hashed = bcrypt.hashSync(plain, 8);

    await pool.query(`
      INSERT INTO "SalesRep" ("distributorId", name, email, phone, password)
      VALUES 
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15)
      ON CONFLICT DO NOTHING;
    `, [
      'pasalho-001', 'John Kipchoge', 'john@pasalho.com', '0712345678', hashed,
      'pasalho-001', 'Alice Mwangi', 'alice@pasalho.com', '0723456789', hashed,
      'pasalho-001', 'Peter Omondi', 'peter@pasalho.com', '0734567890', hashed
    ]);
    console.log('✓ Sales reps created');

    // Create retailers
    await pool.query(`
      INSERT INTO "Retailer" ("distributorId", name, location, phone)
      VALUES 
        ('pasalho-001', 'Asha Traders', 'Main Market', '0712111111'),
        ('pasalho-001', 'Kibera Store', 'Kibera', '0712222222'),
        ('pasalho-001', 'Eastleigh Supermarket', 'Eastleigh', '0712333333')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Retailers created');

    // Create products
    await pool.query(`
      INSERT INTO "Product" ("distributorId", name, price, unit)
      VALUES 
        ('pasalho-001', 'Sugar 50kg', 1200, 'bag'),
        ('pasalho-001', 'Rice 25kg', 1800, 'bag'),
        ('pasalho-001', 'Cooking Oil 20L', 3200, 'jerican')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Products created');

    console.log('\n✓ Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setup();
