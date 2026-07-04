import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';
import { isAdminRep } from '@/lib/admin';

export const dynamic = 'force-dynamic';

function isAdmin(req: Request) {
  const current = getCurrentRepFromAuthHeader(req);
  return isAdminRep(current);
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const result = await pool.query('SELECT * FROM "Product" ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { name, price, unit } = body;
    const distributorId = 'pasalho-001'; // hardcoded for phase 1

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const productRes = await client.query(
        'INSERT INTO "Product" ("distributorId", name, price, unit) VALUES ($1, $2, $3, $4) RETURNING *',
        [distributorId, name, price, unit]
      );
      
      const newProduct = productRes.rows[0];

      // Phase 1 Temp Workaround: Auto-seed inventory to prevent crash in rep app
      await client.query(
        'INSERT INTO "Inventory" ("distributorId", "productId", "stockOnHand", "lowStockThreshold") VALUES ($1, $2, $3, $4)',
        [distributorId, newProduct.id, 500, 50]
      );
      
      await client.query('COMMIT');
      return NextResponse.json(newProduct);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, name, price, unit } = body;
    const result = await pool.query(
      'UPDATE "Product" SET name = $1, price = $2, unit = $3 WHERE id = $4 RETURNING *',
      [name, price, unit, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
