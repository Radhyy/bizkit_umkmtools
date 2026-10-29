import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendResetPasswordEmail } from '@/lib/email';
import { checkRateLimit, isValidEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 3, 10 * 60 * 1000)) { // Max 3 request forgot password per 10 min
      return NextResponse.json({ error: 'Anda meminta reset password terlalu sering. Tunggu 10 menit.' }, { status: 429 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Email tidak terdaftar di sistem kami.' }, { status: 404 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    await pool.query(
      'UPDATE "User" SET "otpCode" = $1, "otpExpiry" = $2 WHERE email = $3',
      [otpCode, otpExpiry, email]
    );

    try {
      await sendResetPasswordEmail(email, otpCode);
    } catch (err) {
      console.error('Gagal mengirim email reset:', err);
      return NextResponse.json({ error: 'Gagal mengirim email, coba lagi nanti.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Kode OTP telah dikirimkan ke email Anda.' }, { status: 200 });

  } catch (error) {
    console.error('Error forgot password:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
