import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const distributorId = searchParams.get('distributorId') || 'pasalho-001';

    const result = await pool.query(
      'SELECT id, name, email, phone, "distributorId" FROM "SalesRep" WHERE "distributorId" = $1 AND status = $2 ORDER BY name',
      [distributorId, 'active']
    );

    return Response.json({ reps: result.rows });
  } catch (error: any) {
    console.error('Error fetching reps:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
