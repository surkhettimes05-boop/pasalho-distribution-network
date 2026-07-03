import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (current.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const distributorId = searchParams.get('distributorId') || current.distributorId;
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const params: any[] = [distributorId];
  let where = 'WHERE o."distributorId" = $1';
  if (start) { params.push(start); where += ` AND o."createdAt" >= $${params.length}`; }
  if (end) { params.push(end); where += ` AND o."createdAt" <= $${params.length}`; }

  try {
    const sql = `SELECT oi."productId", p.name, SUM(oi.quantity) as totalQty, SUM(oi.quantity * p.price) as totalValue FROM "OrderItem" oi JOIN "Order" o ON oi."orderId" = o.id JOIN "Product" p ON oi."productId" = p.id ${where} GROUP BY oi."productId", p.name ORDER BY totalQty DESC`;
    const res = await pool.query(sql, params);
    return NextResponse.json({ report: res.rows });
  } catch (err: any) {
    console.error('Report error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
