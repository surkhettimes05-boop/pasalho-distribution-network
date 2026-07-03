import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';

export async function GET(request: Request) {
  const current = getCurrentRepFromAuthHeader(request);
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const reps = await pool.query('SELECT id, name, email, phone, "distributorId" FROM "SalesRep" WHERE "distributorId" = $1', [current.distributorId]);
    return NextResponse.json({ reps: reps.rows });
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Accept JSON import (admins only)
  const current = getCurrentRepFromAuthHeader(request);
  if (!current || current.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const data = await request.json();
  // naive import: insert reps (upsert by email)
  try {
    for (const r of data.reps || []) {
      await pool.query('INSERT INTO "SalesRep" ("distributorId", name, email, phone) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone', [r.distributorId, r.name, r.email, r.phone]);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
