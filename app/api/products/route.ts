import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get('distributorId') || 'pasalho-001';

    const result = await pool.query(
      'SELECT id, name, price, unit FROM "Product" WHERE "distributorId" = $1 ORDER BY name',
      [distributorId]
    );

    return NextResponse.json({ products: result.rows });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export async function POST(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (current.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const result = await pool.query(
      'INSERT INTO "Product" ("distributorId", name, price, unit, "createdAt") VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [current.distributorId, body.name, body.price, body.unit]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
