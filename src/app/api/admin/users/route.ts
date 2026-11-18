import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Ambil daftar seluruh user untuk admin
export async function GET(req: Request) {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, "isVerified", "createdAt", "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);

    const users = result.rows;
    const stats = {
      total: users.length,
      free: users.filter(u => u.role === 'free' || !u.role).length,
      premium: users.filter(u => u.role === 'premium').length,
      admin: users.filter(u => u.role === 'admin').length,
    };

    return NextResponse.json({ users, stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

// PATCH: Ubah role user (misal Free -> Premium atau sebaliknya)
export async function PATCH(req: Request) {
  try {
    const { userId, newRole } = await req.json();

    if (!userId || !['free', 'premium', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Data role atau user ID tidak valid.' }, { status: 400 });
    }

    const updateResult = await pool.query(
      `UPDATE "User" SET "role" = $1, "updatedAt" = NOW() WHERE "id" = $2 RETURNING id, name, email, role`,
      [newRole, userId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Role pengguna berhasil diperbarui.',
      user: updateResult.rows[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Gagal memperbarui role pengguna.' }, { status: 500 });
  }
}
