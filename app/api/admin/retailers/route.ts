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
    const result = await pool.query('SELECT * FROM "Retailer" ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { name, location, phone } = body;
    const distributorId = 'pasalho-001';

    const result = await pool.query(
      'INSERT INTO "Retailer" ("distributorId", name, location, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [distributorId, name, location, phone]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, name, location, phone } = body;
    const result = await pool.query(
      'UPDATE "Retailer" SET name = $1, location = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, location, phone, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
