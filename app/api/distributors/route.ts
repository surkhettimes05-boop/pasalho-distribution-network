import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const result = await pool.query('SELECT * FROM information_schema.tables WHERE table_schema = $1', ['public']);
  return NextResponse.json({ tables: result.rows });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, location, pricingTier } = body;

  const result = await pool.query(
    'INSERT INTO distributors (name, location, "pricingTier", "createdAt") VALUES ($1, $2, $3, NOW()) RETURNING *',
    [name, location, pricingTier]
  );

  return NextResponse.json(result.rows[0]);
}
