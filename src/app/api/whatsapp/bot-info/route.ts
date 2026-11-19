import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Ambil status dan nomor bot WhatsApp yang aktif untuk pengguna
export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT "status", "phoneNumber" FROM "WhatsAppBotSession" WHERE id = 'primary' LIMIT 1`
      );

      const session = res.rows[0];
      const isConnected = session?.status === 'connected';
      const botPhoneNumber = session?.phoneNumber || null;

      return NextResponse.json({
        success: true,
        isConnected,
        botPhoneNumber,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
