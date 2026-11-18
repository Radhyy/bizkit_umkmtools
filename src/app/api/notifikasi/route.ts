import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Helper format waktu relatif bahasa Indonesia
export function getRelativeTimeIndo(dateStr: string | Date): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} minggu yang lalu`;
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// GET: Ambil daftar notifikasi realtime milik user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // Ambil semua notifikasi user diurutkan dari yang terbaru
    const result = await pool.query(
      `SELECT id, "userId", title, message, category, type, read, link, "createdAt"
       FROM "Notification"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [userId]
    );

    const notifications = result.rows.map((row) => ({
      ...row,
      time: getRelativeTimeIndo(row.createdAt),
    }));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Gagal mengambil data notifikasi', detail: error?.message }, { status: 500 });
  }
}

// PATCH: Tandai dibaca (satu atau semua)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, markAll } = body;

    if (markAll && userId) {
      await pool.query(
        `UPDATE "Notification" SET read = true WHERE "userId" = $1`,
        [userId]
      );
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca.' });
    }

    if (id) {
      await pool.query(
        `UPDATE "Notification" SET read = true WHERE id = $1`,
        [id]
      );
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai telah dibaca.' });
    }

    return NextResponse.json({ error: 'Parameter id atau userId wajib disertakan.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status notifikasi', detail: error?.message }, { status: 500 });
  }
}

// DELETE: Hapus notifikasi
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID notifikasi dan User ID wajib disertakan.' }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM "Notification" WHERE id = $1 AND "userId" = $2`,
      [id, userId]
    );

    return NextResponse.json({ success: true, message: 'Notifikasi berhasil dihapus.' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Gagal menghapus notifikasi', detail: error?.message }, { status: 500 });
  }
}

