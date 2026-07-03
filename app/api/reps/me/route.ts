import { NextResponse } from 'next/server';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await pool.query('SELECT id, name, email, phone, "distributorId" FROM "SalesRep" WHERE id = $1', [current.repId]);
    if (res.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ rep: res.rows[0] });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, phone } = body;
  try {
    await pool.query('UPDATE "SalesRep" SET name = $1, phone = $2 WHERE id = $3', [name, phone, current.repId]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
