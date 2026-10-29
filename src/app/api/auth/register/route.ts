import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendOTPEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import { checkRateLimit, isValidEmail } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!checkRateLimit(ip, 5, 10 * 60 * 1000)) { // 5 request / 10 menit
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba beberapa saat lagi.' }, { status: 429 });
    }

    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Semua data wajib diisi.' }, { status: 400 });
    }

    if (name.length > 100 || password.length > 100) {
      return NextResponse.json({ error: 'Input terlalu panjang.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Buat OTP (6 digit angka acak)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Berakhir dalam 10 menit
    const id = uuidv4();

    // Simpan ke database (status isVerified = false)
    await pool.query(
      'INSERT INTO "User" (id, email, name, password, "isVerified", "otpCode", "otpExpiry") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, email, name || '', hashedPassword, false, otpCode, otpExpiry]
    );

    // Kirim email OTP
    try {
      await sendOTPEmail(email, otpCode);
    } catch (emailError) {
      console.error('Gagal mengirim email:', emailError);
      return NextResponse.json({ error: 'Gagal mengirim email OTP, pastikan pengaturan email benar.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Registrasi berhasil, silakan periksa email Anda untuk OTP.' }, { status: 201 });

  } catch (error) {
    console.error('Error saat register:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
