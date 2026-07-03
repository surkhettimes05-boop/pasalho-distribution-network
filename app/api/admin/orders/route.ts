import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export const dynamic = 'force-dynamic';

function isAdmin(req: Request) {
  const current = getCurrentRepFromAuthHeader(req);
  return current && (current.role === 'admin' || current.email === 'john@pasalho.com');
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const result = await pool.query(`
      SELECT 
        o.id, o.status, o."paymentStatus", o."createdAt",
        r.name as "retailerName", r.location as "retailerLocation",
        s.name as "repName",
        json_agg(json_build_object(
          'productId', oi."productId",
          'quantity', oi.quantity,
          'productName', p.name,
          'productPrice', p.price
        )) as items,
        SUM(oi.quantity * p.price) as "totalAmount"
      FROM "Order" o
      JOIN "Retailer" r ON o."retailerId" = r.id
      LEFT JOIN "SalesRep" s ON o."repId" = s.id
      LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON oi."productId" = p.id
      GROUP BY o.id, r.name, r.location, s.name
      ORDER BY o."createdAt" DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, status } = body;
    const result = await pool.query(
      'UPDATE "Order" SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
