import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, orderId, plan = 'monthly' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Cek apakah pengguna ada di database
    const userCheck = await pool.query('SELECT id, name, email, role FROM "User" WHERE id = $1 LIMIT 1', [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const user = userCheck.rows[0];

    // 2. Verifikasi status transaksi ke API Midtrans (jika ada orderId)
    let isPaymentVerified = true;
    if (orderId) {
      try {
        const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        const statusUrl = isProduction
          ? `https://api.midtrans.com/v2/${orderId}/status`
          : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

        const checkRes = await fetch(statusUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });

        if (checkRes.ok) {
          const statusData = await checkRes.json();
          const validStatuses = ['settlement', 'capture', 'success', 'pending'];
          if (!validStatuses.includes(statusData.transaction_status)) {
            isPaymentVerified = false;
          }
        }
      } catch (e) {
        console.warn('Gagal cek status Midtrans langsung, melanjutkan aktivasi dari callback Snap:', e);
      }
    }

    if (!isPaymentVerified) {
      return NextResponse.json({ error: 'Pembayaran belum diselesaikan atau gagal di sistem Midtrans.' }, { status: 400 });
    }

    // 3. Update status pengguna menjadi Premium dan buka kunci
    const updateResult = await pool.query(`
      UPDATE "User"
      SET 
        role = 'premium',
        "isLocked" = false,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING id, name, email, role, "isLocked", "updatedAt"
    `, [userId]);

    const updatedUser = updateResult.rows[0];

    // 4. Catat notifikasi sukses ke akun pengguna
    try {
      const planName = plan === 'yearly' ? 'Tahunan (1 Tahun)' : 'Bulanan (1 Bulan)';
      await pool.query(`
        INSERT INTO "Notification" (id, "userId", title, message, category, type, "isRead", "createdAt")
        VALUES ($1, $2, $3, $4, 'keuangan', 'success', false, NOW())
      `, [
        uuidv4(),
        userId,
        'Upgrade Paket Premium Berhasil!',
        `Selamat! Pembayaran paket Premium ${planName} Anda telah berhasil diproses melalui Midtrans. Seluruh akses dashboard dan fitur kecerdasan buatan telah terbuka secara penuh.`
      ]);
    } catch (notifErr) {
      console.warn('Gagal mencatat notifikasi:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Akun Anda berhasil ditingkatkan ke paket Premium!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error verify payment route:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem saat memverifikasi pembayaran.' }, { status: 500 });
  }
}

