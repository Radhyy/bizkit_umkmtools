import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcrypt';
import { getPlanCacheMetrics, flushPlanCache } from '@/lib/planCache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || 'radiaakbarradia@gmail.com';

    // Ambil data admin dari tabel User
    const userRes = await pool.query(
      `SELECT id, name, email, role, "createdAt", "updatedAt" FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    const adminUser = userRes.rows[0] || {
      id: 'admin',
      name: 'Radhiyya',
      email: 'radiaakbarradia@gmail.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    // System Diagnostik
    const midtransConfigured = Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
    const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const waGroqKeysCount = (process.env.GROQ_WA_API_KEYS || '').split(',').filter(Boolean).length;
    const cacheMetrics = getPlanCacheMetrics();

    return NextResponse.json({
      success: true,
      admin: adminUser,
      system: {
        nodeEnv: process.env.NODE_ENV || 'development',
        databaseConnected: true,
        midtrans: {
          isConfigured: midtransConfigured,
          isProduction: midtransIsProduction,
          clientKeyPreview: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ? `${process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY.slice(0, 12)}...` : 'Belum diatur'
        },
        aiEngine: {
          model: 'qwen/qwen3.8-27b',
          groqKeysCount: waGroqKeysCount || 5,
          loadBalancerStrategy: 'Round-Robin + Failover'
        },
        whatsAppGateway: {
          servicePort: 3001,
          autoReconnect: true,
          library: 'Baileys Multi-Device'
        },
        cacheMetrics
      }
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/settings:', err);
    return NextResponse.json({ success: false, error: 'Gagal memuat pengaturan admin.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { email, name, currentPassword, newPassword, action } = body;

    if (action === 'flush_cache') {
      flushPlanCache();
      return NextResponse.json({ success: true, message: 'Otak cache berhasil dibersihkan dan disegarkan.' });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email admin wajib disertakan.' }, { status: 400 });
    }

    // Ambil data admin saat ini
    const userRes = await pool.query(`SELECT * FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Akun admin tidak ditemukan.' }, { status: 404 });
    }

    const admin = userRes.rows[0];

    // Jika ingin ubah password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: 'Kata sandi saat ini wajib diisi untuk verifikasi keamanan.' }, { status: 400 });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, error: 'Kata sandi saat ini tidak cocok.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Kata sandi baru minimal 6 karakter.' }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query(`UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2`, [hashed, admin.id]);
    }

    // Jika ingin ubah nama
    if (name && name.trim()) {
      await pool.query(`UPDATE "User" SET name = $1, "updatedAt" = NOW() WHERE id = $2`, [name.trim(), admin.id]);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan akun administrator berhasil diperbarui!'
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/admin/settings:', err);
    return NextResponse.json({ success: false, error: err.message || 'Gagal menyimpan pengaturan.' }, { status: 500 });
  }
}
