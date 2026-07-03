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
        sr.id as "repId", 
        sr.name as "repName", 
        sr.email as "repEmail",
        COUNT(DISTINCT o.id)::int as "totalOrders",
        COALESCE(SUM(oi.quantity * p.price), 0)::int as "totalRevenue"
       FROM "SalesRep" sr
       LEFT JOIN "Order" o ON sr.id = o."repId" AND o.status != 'cancelled'
       LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
       LEFT JOIN "Product" p ON oi."productId" = p.id
       WHERE sr."distributorId" = $1
       GROUP BY sr.id, sr.name, sr.email
       ORDER BY "totalRevenue" DESC, "totalOrders" DESC`,
      [distributorId]
    );

    return NextResponse.json({ report: result.rows });
  } catch (err: any) {
    console.error('Rep performance report error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
