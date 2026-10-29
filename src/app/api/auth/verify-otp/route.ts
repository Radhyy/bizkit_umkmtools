import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ error: 'Email dan kode OTP wajib diisi.' }, { status: 400 });
    }

    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Email tidak ditemukan.' }, { status: 400 });
    }

    const user = userResult.rows[0];

    // Jika sudah terverifikasi
    if (user.isVerified) {
      return NextResponse.json({ message: 'Akun Anda sudah terverifikasi sebelumnya.' }, { status: 200 });
    }

    // Cek kecocokan OTP
    if (user.otpCode !== otpCode) {
      return NextResponse.json({ error: 'Kode OTP salah.' }, { status: 400 });
    }

    // Cek kedaluwarsa OTP
    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.' }, { status: 400 });
    }

    // Update status menjadi terverifikasi dan hapus OTP
    await pool.query(
      'UPDATE "User" SET "isVerified" = true, "otpCode" = null, "otpExpiry" = null, "updatedAt" = NOW() WHERE email = $1',
      [email]
    );

    return NextResponse.json({ 
      message: 'Verifikasi berhasil! Akun Anda sudah aktif.',
      user: { id: user.id, name: user.name, email: user.email }
    }, { status: 200 });

  } catch (error) {
    console.error('Error saat verifikasi OTP:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
