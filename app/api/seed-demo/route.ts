import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const hashed = bcrypt.hashSync('pass123', 8);
    
    // Check if the user exists
    const res = await pool.query('SELECT * FROM "SalesRep" WHERE email = $1', ['ram@pasalho.com']);
    
    if (res.rowCount === 0) {
      await pool.query(
        'INSERT INTO "SalesRep" (name, email, password, status, role) VALUES ($1, $2, $3, $4, $5)',
        ['Ram (Demo)', 'ram@pasalho.com', hashed, 'active', 'admin']
      );
    } else {
      await pool.query(
        'UPDATE "SalesRep" SET password = $1 WHERE email = $2',
        [hashed, 'ram@pasalho.com']
      );
    }
    
    return NextResponse.json({ success: true, message: 'Demo user ram@pasalho.com seeded successfully with password pass123' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
