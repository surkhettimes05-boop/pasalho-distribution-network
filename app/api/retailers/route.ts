import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get('distributorId') || 'pasalho-001';

    const result = await pool.query(
      'SELECT id, name, location, phone FROM "Retailer" WHERE "distributorId" = $1 ORDER BY name',
      [distributorId]
    );

    return NextResponse.json({ retailers: result.rows });
  } catch (error: any) {
    console.error('Error fetching retailers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await pool.query(
    'INSERT INTO retailers (name, location, phone, "createdAt") VALUES ($1, $2, $3, NOW()) RETURNING *',
    [body.name, body.location, body.phone]
  );
  return NextResponse.json(result.rows[0]);
}
