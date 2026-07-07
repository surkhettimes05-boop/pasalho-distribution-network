import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (current.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const distributorId = searchParams.get('distributorId') || current.distributorId;

  try {
    const result = await pool.query(
      `SELECT 
        "productId", 
        name, 
        unit,
        "totalQuantity", 
        "totalRevenue"
       FROM top_products_view
       WHERE "distributorId" = $1
       ORDER BY "totalQuantity" DESC, "totalRevenue" DESC`,
      [distributorId]
    );

    return NextResponse.json({ report: result.rows });
  } catch (err: any) {
    console.error('Top products report error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
