import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// Pastikan tabel InfluencerContactLog tersedia
async function ensureContactLogTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "InfluencerContactLog" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT,
      "influencerHandle" TEXT NOT NULL,
      "influencerName" TEXT,
      "actionType" TEXT NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "idx_inf_contact_log_handle" ON "InfluencerContactLog" ("influencerHandle");
    CREATE INDEX IF NOT EXISTS "idx_inf_contact_log_created_at" ON "InfluencerContactLog" ("createdAt");
  `);
}

export async function POST(req: Request) {
  try {
    await ensureContactLogTable();

    const body = await req.json();
    const { userId, influencerHandle, influencerName, actionType } = body;

    if (!influencerHandle || !actionType) {
      return NextResponse.json({ error: 'Data influencer dan actionType wajib disertakan.' }, { status: 400 });
    }

    const logId = 'log_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const cleanHandle = influencerHandle.trim().toLowerCase();

    await pool.query(
      `INSERT INTO "InfluencerContactLog" ("id", "userId", "influencerHandle", "influencerName", "actionType", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [logId, userId || 'anonymous', cleanHandle, influencerName || '', actionType]
    );

    // Hitung total kontak terbaru untuk influencer ini across all dashboard
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "InfluencerContactLog" WHERE "influencerHandle" = $1`,
      [cleanHandle]
    );

    const totalContacts = countRes.rows[0]?.count || 1;

    return NextResponse.json({
      success: true,
      message: 'Log kontak berhasil dicatat across dashboard.',
      totalContactsForCreator: totalContacts,
    });
  } catch (error: any) {
    console.error('Error logging influencer contact:', error);
    return NextResponse.json({ error: 'Gagal mencatat log kontak.', detail: error?.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureContactLogTable();

    const statsRes = await pool.query(`
      SELECT "influencerHandle", COUNT(*)::int AS "contactCount"
      FROM "InfluencerContactLog"
      GROUP BY "influencerHandle"
    `);

    const contactMap: Record<string, number> = {};
    let totalAll = 0;
    statsRes.rows.forEach((r) => {
      contactMap[r.influencerHandle.toLowerCase()] = r.contactCount;
      totalAll += r.contactCount;
    });

    return NextResponse.json({
      success: true,
      contactCounts: contactMap,
      totalContactsAcrossPlatform: totalAll,
    });
  } catch (error: any) {
    console.error('Error fetching contact stats:', error);
    return NextResponse.json({ error: 'Gagal mengambil statistik kontak.', detail: error?.message }, { status: 500 });
  }
}
