import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const envKeys = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    postgresUrlLength: process.env.POSTGRES_URL?.length || 0,
  };

  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    return NextResponse.json({
      ok: true,
      message: 'API and database connected successfully!',
      time: res.rows[0].current_time,
      env: envKeys
    });
  } catch (err: any) {
    console.error('Health check database query failed:', err);
    return NextResponse.json({
      ok: false,
      message: 'Database connection failed',
      error: err.message || err,
      env: envKeys
    }, { status: 500 });
  }
}
