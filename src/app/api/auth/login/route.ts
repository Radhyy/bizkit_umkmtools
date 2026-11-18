import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { checkRateLimit, isValidEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 10, 10 * 60 * 1000)) { // 10 request / 10 menit
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba 10 menit lagi.' }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    // Cari user
    const userResult = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    const user = userResult.rows[0];

    // Cek password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }

    // Cek verifikasi OTP
    if (!user.isVerified) {
      return NextResponse.json({ 
        error: 'Akun Anda belum diverifikasi. Silakan masukkan kode OTP yang telah dikirim ke email Anda.',
        needsVerification: true,
        email: user.email
      }, { status: 403 });
    }

    // Ambil role dari database (default: 'free')
    const userRole = user.role || 'free';

    // Login sukses
    return NextResponse.json({ 
      message: 'Login berhasil!', 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: userRole 
      } 
    }, { status: 200 });

  } catch (error) {
    console.error('Error saat login:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
