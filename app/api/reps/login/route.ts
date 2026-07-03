import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { hashToken } from '@/lib/tokenHash';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id, name, email, phone, "distributorId", password, role FROM "SalesRep" WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const row = result.rows[0];
    const match = await bcrypt.compare(password, row.password || '');
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password: _pw, ...rep } = row;

    // Issue tokens (include role for RBAC)
    const tokenPayload = { repId: rep.id, distributorId: rep.distributorId, name: rep.name, role: rep.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Store refresh token hash in DB for revocation (avoid storing raw token)
    try {
      const decoded: any = jwt.decode(refreshToken) || {};
      const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
      const tokenHash = hashToken(refreshToken);
      await pool.query('INSERT INTO "RefreshToken" ("tokenHash", "repId", "expiresAt") VALUES ($1, $2, $3) ON CONFLICT ("tokenHash") DO NOTHING', [tokenHash, rep.id, expiresAt]);
    } catch (e) {
      console.error('Failed to store refresh token hash:', e);
    }

    return NextResponse.json({ rep, accessToken, refreshToken });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
