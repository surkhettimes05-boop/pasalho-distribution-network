const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:pkdon123@localhost:5432/pasalho?schema=public';
const pool = new Pool({ connectionString });

async function run() {
  const client = await pool.connect();
  try {
    console.log('Creating materialized views...');
    
    // Drop existing if we are recreating
    await client.query('DROP MATERIALIZED VIEW IF EXISTS daily_sales_view;');
    await client.query('DROP MATERIALIZED VIEW IF EXISTS top_products_view;');

    // daily_sales_view
    await client.query(`
      CREATE MATERIALIZED VIEW daily_sales_view AS
      SELECT 
        o."distributorId",
        DATE(o."createdAt") as sale_date,
        oi."productId", 
        p.name, 
        SUM(oi.quantity) as totalQty, 
        SUM(oi.quantity * p.price) as totalValue 
      FROM "OrderItem" oi 
      JOIN "Order" o ON oi."orderId" = o.id 
      JOIN "Product" p ON oi."productId" = p.id 
      GROUP BY o."distributorId", DATE(o."createdAt"), oi."productId", p.name;
    `);

    // Add unique indexes to allow concurrent refreshes later
    await client.query(`
      CREATE UNIQUE INDEX idx_daily_sales_view_unique 
      ON daily_sales_view("distributorId", sale_date, "productId");
    `);

    // top_products_view
    await client.query(`
      CREATE MATERIALIZED VIEW top_products_view AS
      SELECT 
        p."distributorId",
        p.id as "productId", 
        p.name, 
        p.unit,
        COALESCE(SUM(oi.quantity), 0)::int as "totalQuantity", 
        COALESCE(SUM(oi.quantity * p.price), 0)::int as "totalRevenue"
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
      LEFT JOIN "Order" o ON oi."orderId" = o.id AND o.status != 'cancelled'
      GROUP BY p."distributorId", p.id, p.name, p.unit;
    `);

    await client.query(`
      CREATE UNIQUE INDEX idx_top_products_view_unique 
      ON top_products_view("distributorId", "productId");
    `);

    console.log('Materialized views created successfully!');
  } catch (err) {
    console.error('Error creating views:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
