import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

// GET: Ambil 3 riwayat export terakhir milik user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, "fileName", format, "dataType", "dateRange", "recordCount", "totalAmount", "fileSize", "createdAt"
       FROM "ExportHistory"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 3`,
      [userId]
    );

    return NextResponse.json({ history: result.rows });
  } catch (error: any) {
    console.error('Error fetching export history:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat export', detail: error?.message }, { status: 500 });
  }
}

// POST: Simpan riwayat export baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, fileName, format, dataType, dateRange, recordCount, totalAmount, fileSize } = body;

    if (!userId || !fileName || !format) {
      return NextResponse.json({ error: 'Parameter export tidak lengkap.' }, { status: 400 });
    }

    const id = 'exp_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const result = await pool.query(
      `INSERT INTO "ExportHistory" 
        ("id", "userId", "fileName", format, "dataType", "dateRange", "recordCount", "totalAmount", "fileSize", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id, "fileName", format, "dataType", "dateRange", "recordCount", "totalAmount", "fileSize", "createdAt"`,
      [
        id,
        userId,
        fileName,
        format,
        dataType || 'semua',
        dateRange || 'Semua Periode',
        Number(recordCount) || 0,
        Number(totalAmount) || 0,
        fileSize || '42 KB'
      ]
    );

    // Otomatis buat notifikasi bahwa export data siap
    try {
      const notifId = 'notif_exp_' + id.replace(/-/g, '').substring(0, 14);
      await pool.query(
        `INSERT INTO "Notification" ("id", "userId", "title", "message", "category", "type", "read", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
        [
          notifId,
          userId,
          'Laporan Berhasil Diekspor',
          `Berkas ${fileName} (${format.toUpperCase()}) untuk periode ${dateRange || 'Semua Periode'} berhasil disiapkan dan diunduh.`,
          'sistem',
          'info'
        ]
      );
    } catch (notifErr) {
      console.warn('Gagal menyimpan notifikasi export:', notifErr);
    }

    return NextResponse.json({ success: true, item: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving export history:', error);
    return NextResponse.json({ error: 'Gagal menyimpan riwayat export', detail: error?.message }, { status: 500 });
  }
}

