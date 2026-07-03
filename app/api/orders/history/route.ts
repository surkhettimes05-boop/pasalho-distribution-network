import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object('productId', oi."productId", 'quantity', oi.quantity)) as items
       FROM "Order" o
       LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
       WHERE o."repId" = $1
       GROUP BY o.id
       ORDER BY o."createdAt" DESC`,
      [current.repId]
    );
    return NextResponse.json({ orders: result.rows });
  } catch (err: any) {
    console.error('History error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
