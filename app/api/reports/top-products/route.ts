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
        p.id as "productId", 
        p.name, 
        p.unit,
        COALESCE(SUM(oi.quantity), 0)::int as "totalQuantity", 
        COALESCE(SUM(oi.quantity * p.price), 0)::int as "totalRevenue"
       FROM "Product" p
       LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
       LEFT JOIN "Order" o ON oi."orderId" = o.id AND o.status != 'cancelled'
       WHERE p."distributorId" = $1
       GROUP BY p.id, p.name, p.unit
       ORDER BY "totalQuantity" DESC, "totalRevenue" DESC`,
      [distributorId]
    );

    return NextResponse.json({ report: result.rows });
  } catch (err: any) {
    console.error('Top products report error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
