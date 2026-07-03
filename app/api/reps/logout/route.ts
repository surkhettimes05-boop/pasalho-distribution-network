import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentRepFromAuthHeader } from '@/lib/getCurrentRep';
import { hashToken } from '@/lib/tokenHash';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken } = body || {};

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await pool.query('UPDATE "RefreshToken" SET revoked = true WHERE "tokenHash" = $1', [tokenHash]);
      return NextResponse.json({ ok: true });
    }

    // If no refreshToken provided, try to revoke all tokens for current rep
    const current = getCurrentRepFromAuthHeader(request);
    if (current && current.repId) {
      await pool.query('UPDATE "RefreshToken" SET revoked = true WHERE "repId" = $1', [current.repId]);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
