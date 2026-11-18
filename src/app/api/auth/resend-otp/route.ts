import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { checkRateLimit, isValidEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 5, 5 * 60 * 1000)) { // 5 request / 5 menit
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat lagi.' }, { status: 429 });
    }

    const { email } = await req.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    // Cari user
    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Email tidak ditemukan.' }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (user.isVerified) {
      return NextResponse.json({ error: 'Akun ini sudah terverifikasi. Silakan langsung login.' }, { status: 400 });
    }

    // Buat OTP baru
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    await pool.query(
      'UPDATE "User" SET "otpCode" = $1, "otpExpiry" = $2, "updatedAt" = NOW() WHERE email = $3',
      [otpCode, otpExpiry, email]
    );

    // Kirim email OTP
    try {
      await sendOTPEmail(email, otpCode);
    } catch (emailError: any) {
      console.error('Gagal mengirim ulang email OTP:', emailError);
      return NextResponse.json({ 
        error: 'Gagal mengirim email OTP. Pastikan email Anda benar atau coba lagi nanti.' 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Kode OTP baru berhasil dikirim ke email Anda!' }, { status: 200 });
  } catch (error) {
    console.error('Error saat kirim ulang OTP:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
