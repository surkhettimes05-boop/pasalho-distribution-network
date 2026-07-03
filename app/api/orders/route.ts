import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const distributorId = searchParams.get('distributorId');
  const current = getCurrentRepFromAuthHeader(request);
  
  try {
    if (distributorId) {
      const result = await pool.query(
        `SELECT o.*, json_agg(json_build_object('productId', oi."productId", 'quantity', oi.quantity)) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi."orderId"
         WHERE o."distributorId" = $1
         ${current ? 'AND o."repId" = $2' : ''}
         GROUP BY o.id
         ORDER BY o."createdAt" DESC`,
        current ? [distributorId, current.repId] : [distributorId]
      );
      return NextResponse.json(result.rows);
    } else {
      const result = await pool.query(
        `SELECT o.*, json_agg(json_build_object('productId', oi."productId", 'quantity', oi.quantity)) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi."orderId"
         GROUP BY o.id
         ORDER BY o."createdAt" DESC`
      );
      return NextResponse.json(result.rows);
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { distributorId, retailerId, repId, status, paymentStatus, items } = body;
  const current = getCurrentRepFromAuthHeader(request);
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const effectiveRepId = current?.repId ?? repId ?? null;
      const orderResult = await client.query(
        'INSERT INTO "Order" ("distributorId", "retailerId", "repId", status, "paymentStatus", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
        [distributorId, retailerId, effectiveRepId, status, paymentStatus]
      );
      
      const orderId = orderResult.rows[0].id;
      
      for (const item of items) {
        // Reserve inventory atomically: check and decrement stockOnHand
        const invRes = await client.query('SELECT id, "stockOnHand" FROM "Inventory" WHERE "distributorId" = $1 AND "productId" = $2 FOR UPDATE', [distributorId, item.productId]);
        if (invRes.rowCount === 0) {
          throw new Error(`Inventory record not found for product ${item.productId}`);
        }
        const inv = invRes.rows[0];
        if (inv.stockOnHand < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        await client.query('UPDATE "Inventory" SET "stockOnHand" = "stockOnHand" - $1 WHERE id = $2', [item.quantity, inv.id]);

        await client.query(
          'INSERT INTO "OrderItem" ("orderId", "productId", quantity) VALUES ($1, $2, $3)',
          [orderId, item.productId, item.quantity]
        );
      }

      // Enqueue background processing job for the order
      try {
        const { orderQueue } = await import('@/lib/queue');
        await orderQueue.add('processOrder', { orderId });
      } catch (e) {
        console.error('Failed to enqueue order job:', e);
      }
      
      await client.query('COMMIT');
      return NextResponse.json({ id: orderId, distributorId, retailerId, repId, status, paymentStatus, items });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Error creating order:', err);
    return NextResponse.json({ error: 'Failed to create order: ' + err.message }, { status: 500 });
  }
}
