import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ error: 'Email dan OTP wajib diisi.' }, { status: 400 });
    }

    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Email tidak ditemukan.' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.otpCode !== otpCode) {
      return NextResponse.json({ error: 'Kode OTP salah.' }, { status: 400 });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa. Silakan minta ulang.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Kode OTP valid. Silakan masukkan password baru.' }, { status: 200 });

  } catch (error) {
    console.error('Error verify reset otp:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
