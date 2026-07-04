import { NextResponse } from 'next/server';
import { verifyToken, signAccessToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { hashToken } from '@/lib/tokenHash';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    if (!refreshToken) return NextResponse.json({ error: 'Missing refreshToken' }, { status: 400 });

    // Check DB for tokenHash and not revoked
    const tokenHash = hashToken(refreshToken);
    const dbRes = await pool.query('SELECT * FROM "RefreshToken" WHERE "tokenHash" = $1 AND revoked = false', [tokenHash]);
    if (dbRes.rowCount === 0) return NextResponse.json({ error: 'Invalid or revoked refresh token' }, { status: 401 });

    const payload = verifyToken(refreshToken);
    if (!payload) return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });

    const newAccess = signAccessToken({
      repId: (payload as any).repId,
      distributorId: (payload as any).distributorId,
      name: (payload as any).name,
      email: (payload as any).email,
      role: (payload as any).role,
    });
    return NextResponse.json({ accessToken: newAccess });
  } catch (err: any) {
    console.error('Refresh error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
