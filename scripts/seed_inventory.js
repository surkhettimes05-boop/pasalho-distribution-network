const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_AwCtYLEkgu98@ep-patient-king-atznc2fp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function seedInventory() {
  try {
    // Get all products
    const products = await pool.query('SELECT id, name FROM "Product"');
    console.log(`Found ${products.rowCount} products`);

    for (const p of products.rows) {
      await pool.query(
        `INSERT INTO "Inventory" ("distributorId", "productId", "stockOnHand", "lowStockThreshold")
         VALUES ('pasalho-001', $1, 1000, 50)
         ON CONFLICT DO NOTHING`,
        [p.id]
      );
      console.log(`  ✓ Inventory seeded for: ${p.name} (id=${p.id}) — 1000 units`);
    }

    console.log('\n✓ Inventory seeding complete!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

seedInventory();
