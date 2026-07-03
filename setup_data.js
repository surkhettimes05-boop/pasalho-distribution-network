const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho';
const pool = new Pool({ connectionString });

async function setup() {
  try {
    console.log('Cleaning up old data...');
    // Delete in reverse dependency order
    await pool.query('DELETE FROM "Inventory"');
    await pool.query('DELETE FROM "OrderItem"');
    await pool.query('DELETE FROM "Order"');
    await pool.query('DELETE FROM "Product"');
    await pool.query('DELETE FROM "Retailer"');
    await pool.query('DELETE FROM "SalesRep"');
    await pool.query('DELETE FROM "Distributor"');

    // Create Pasalho distributor
    await pool.query(`
      INSERT INTO "Distributor" (id, name, location, "pricingTier")
      VALUES ('pasalho-001', 'Pasalho Distribution Network', 'Surkhet', 'premium')
    `);
    console.log('✓ Distributor created');

    // Create sales reps
    const bcrypt = require('bcryptjs');
    const plain = 'pass123';
    const hashed = bcrypt.hashSync(plain, 8);

    await pool.query(`
      INSERT INTO "SalesRep" ("distributorId", name, email, phone, password, role)
      VALUES 
        ('pasalho-001', 'Ram Shrestha', 'ram@pasalho.com', '9841111111', $1, 'admin'),
        ('pasalho-001', 'Sita Thapa', 'sita@pasalho.com', '9842222222', $1, 'rep'),
        ('pasalho-001', 'Hari Gurung', 'hari@pasalho.com', '9843333333', $1, 'rep')
    `, [hashed]);
    console.log('✓ Sales reps created');

    // Create retailers
    await pool.query(`
      INSERT INTO "Retailer" ("distributorId", name, location, phone)
      VALUES 
        ('pasalho-001', 'Surkhet Kirana Pasal', 'Birendranagar', '9851111111'),
        ('pasalho-001', 'Birendranagar General Store', 'Surkhet Bazar', '9852222222'),
        ('pasalho-001', 'Karnali Traders', 'Chinchu', '9853333333')
    `);
    console.log('✓ Retailers created');

    // Create products
    const productInsert = await pool.query(`
      INSERT INTO "Product" ("distributorId", name, price, unit)
      VALUES 
        ('pasalho-001', 'Sugar 50kg', 4200, 'bag'),
        ('pasalho-001', 'Jeera Masino Rice 25kg', 2250, 'bag'),
        ('pasalho-001', 'Sunflower Oil 20L', 4500, 'jerican'),
        ('pasalho-001', 'Wai Wai Noodles (Carton)', 1100, 'carton'),
        ('pasalho-001', 'Lifebuoy Soap (Pack of 12)', 480, 'pack')
      RETURNING id, "distributorId"
    `);
    console.log('✓ Products created');

    // Create inventory
    for (const p of productInsert.rows) {
      await pool.query(`
        INSERT INTO "Inventory" ("distributorId", "productId", "stockOnHand", "lowStockThreshold")
        VALUES ($1, $2, $3, $4)
      `, [p.distributorId, p.id, 500, 50]);
    }
    console.log('✓ Inventory seeded');
    console.log('\n✓ Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setup();
