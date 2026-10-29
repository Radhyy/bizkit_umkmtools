import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { email, otpCode, newPassword } = await req.json();

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi.' }, { status: 400 });
    }

    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Email atau OTP salah.' }, { status: 400 });
    }

    const user = userResult.rows[0];

    if (user.otpCode !== otpCode) {
      return NextResponse.json({ error: 'Kode OTP salah.' }, { status: 400 });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa. Silakan minta ulang.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE "User" SET password = $1, "otpCode" = null, "otpExpiry" = null, "updatedAt" = NOW() WHERE email = $2',
      [hashedPassword, email]
    );

    return NextResponse.json({ message: 'Password berhasil diubah. Silakan login.' }, { status: 200 });

  } catch (error) {
    console.error('Error reset password:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
