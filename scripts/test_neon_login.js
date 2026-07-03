const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const connectionString = 'postgresql://neondb_owner:npg_AwCtYLEkgu98@ep-patient-king-atznc2fp-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

const email = 'john@pasalho.com';
const password = 'pass123';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function testLogin() {
  console.log('Simulating login endpoint against Neon Cloud DB...');
  try {
    // 1. Query user
    console.log('  Querying "SalesRep" table...');
    const result = await pool.query(
      'SELECT id, name, email, phone, "distributorId", password, role FROM "SalesRep" WHERE email = $1 AND status = $2',
      [email, 'active']
    );

    if (result.rowCount === 0) {
      console.error('  ✗ Error: Representative account not found in DB!');
      pool.end();
      return;
    }

    const row = result.rows[0];
    console.log('  ✓ User found:', row.name, 'Role:', row.role);

    // 2. Verify password
    console.log('  Verifying password...');
    const match = await bcrypt.compare(password, row.password || '');
    if (!match) {
      console.error('  ✗ Error: Password mismatch!');
      pool.end();
      return;
    }
    console.log('  ✓ Password verified successfully.');

    // 3. Sign tokens
    console.log('  Signing JWT tokens...');
    const secret = 'dev_secret_change_me';
    const payload = { repId: row.id, distributorId: row.distributorId, name: row.name, role: row.role };
    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '7d' });
    console.log('  ✓ JWT signed.');

    // 4. Insert RefreshToken
    console.log('  Storing RefreshToken hash in DB...');
    const decoded = jwt.decode(refreshToken) || {};
    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : null;
    const tokenHash = hashToken(refreshToken);
    await pool.query(
      'INSERT INTO "RefreshToken" ("tokenHash", "repId", "expiresAt") VALUES ($1, $2, $3) ON CONFLICT ("tokenHash") DO NOTHING',
      [tokenHash, row.id, expiresAt]
    );
    console.log('  ✓ RefreshToken saved.');

    console.log('\n✓ LOGIN FLOW TEST FULLY PASSED!');
  } catch (err) {
    console.error('\n✗ LOGIN FLOW FAILED WITH ERROR:', err.message || err);
  } finally {
    pool.end();
  }
}

testLogin();
