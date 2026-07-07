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
  let where = 'WHERE "distributorId" = $1';
  if (start) { params.push(start); where += ` AND sale_date >= $${params.length}`; }
  if (end) { params.push(end); where += ` AND sale_date <= $${params.length}`; }

  try {
    const sql = `SELECT "productId", name, totalQty, totalValue FROM daily_sales_view ${where} ORDER BY totalQty DESC`;
    const res = await pool.query(sql, params);
    return NextResponse.json({ report: res.rows });
  } catch (err: any) {
    console.error('Report error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
