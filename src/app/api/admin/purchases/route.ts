import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Ambil daftar seluruh pembelian langganan untuk monitoring Super Admin
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        sp.id,
        sp."orderId",
        sp."userId",
        sp.plan,
        sp.amount,
        sp."discountAmount",
        sp."couponCode",
        sp."paymentMethod",
        sp.status,
        sp."snapToken",
        sp."snapRedirectUrl",
        sp."paidAt",
        sp."createdAt",
        sp."updatedAt",
        u.name AS "userName",
        u.email AS "userEmail",
        u.role AS "userRole",
        bp."namaUsaha",
        bp."kotaLokasi",
        bp."kategoriBisnis"
      FROM "SubscriptionPurchase" sp
      LEFT JOIN "User" u ON u.id = sp."userId"
      LEFT JOIN "BusinessProfile" bp ON bp."userId" = sp."userId"
      ORDER BY sp."createdAt" DESC
    `);

    const purchases = result.rows;

    // Kalkulasi metrik ringkasan
    let totalRevenue = 0;
    let settlementCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    purchases.forEach((p) => {
      const status = (p.status || '').toLowerCase();
      const amount = Number(p.amount) || 0;

      if (['settlement', 'capture', 'success'].includes(status)) {
        totalRevenue += amount;
        settlementCount++;
      } else if (status === 'pending') {
        pendingCount++;
      } else if (['expire', 'failed', 'cancel'].includes(status)) {
        failedCount++;
      }
    });

    const stats = {
      totalRevenue,
      settlementCount,
      pendingCount,
      failedCount,
      totalOrders: purchases.length,
    };

    return NextResponse.json({ purchases, stats }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin purchases:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data pembelian.' }, { status: 500 });
  }
}

// PATCH: Sinkronisasi status Midtrans atau verifikasi manual oleh Super Admin
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { purchaseId, orderId, action = 'sync_midtrans' } = body;

    if (!purchaseId && !orderId) {
      return NextResponse.json({ error: 'Purchase ID atau Order ID wajib disertakan.' }, { status: 400 });
    }

    // 1. Ambil data purchase
    const pResult = await pool.query(`
      SELECT id, "orderId", "userId", status, amount, plan FROM "SubscriptionPurchase"
      WHERE ${purchaseId ? 'id = $1' : '"orderId" = $1'}
      LIMIT 1
    `, [purchaseId || orderId]);

    if (pResult.rows.length === 0) {
      return NextResponse.json({ error: 'Data pembelian tidak ditemukan.' }, { status: 404 });
    }

    const purchase = pResult.rows[0];

    // Aksi 1: Sinkronisasi realtime ke API Midtrans
    if (action === 'sync_midtrans') {
      const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
      const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const statusUrl = isProduction
        ? `https://api.midtrans.com/v2/${purchase.orderId}/status`
        : `https://api.sandbox.midtrans.com/v2/${purchase.orderId}/status`;

      const midtransRes = await fetch(statusUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
      });

      if (!midtransRes.ok) {
        return NextResponse.json({ 
          error: 'Gagal mengambil status dari server Midtrans.',
          statusCode: midtransRes.status 
        }, { status: 400 });
      }

      const statusData = await midtransRes.json();
      const rawStatus = (statusData.transaction_status || '').toLowerCase();
      let newStatus = purchase.status;

      if (['settlement', 'capture'].includes(rawStatus)) {
        newStatus = 'settlement';
      } else if (rawStatus === 'pending') {
        newStatus = 'pending';
      } else if (['expire', 'cancel', 'deny', 'failure'].includes(rawStatus)) {
        newStatus = 'expire';
      }

      // Update purchase record
      await pool.query(`
        UPDATE "SubscriptionPurchase"
        SET 
          status = $1,
          "paidAt" = CASE WHEN $1 = 'settlement' THEN NOW() ELSE "paidAt" END,
          "midtransResponse" = $2,
          "updatedAt" = NOW()
        WHERE id = $3
      `, [newStatus, JSON.stringify(statusData), purchase.id]);

      // Jika settlement, upgrade user menjadi premium
      if (newStatus === 'settlement') {
        await pool.query(`
          UPDATE "User"
          SET role = 'premium', "isLocked" = false, "updatedAt" = NOW()
          WHERE id = $1
        `, [purchase.userId]);
      }

      return NextResponse.json({
        message: `Status pembelian berhasil disinkronkan: ${newStatus.toUpperCase()}`,
        status: newStatus,
        midtransData: statusData
      }, { status: 200 });
    }

    // Aksi 2: Verifikasi manual oleh Super Admin
    if (action === 'manual_verify') {
      await pool.query(`
        UPDATE "SubscriptionPurchase"
        SET 
          status = 'settlement',
          "paidAt" = NOW(),
          "updatedAt" = NOW()
        WHERE id = $1
      `, [purchase.id]);

      await pool.query(`
        UPDATE "User"
        SET role = 'premium', "isLocked" = false, "updatedAt" = NOW()
        WHERE id = $1
      `, [purchase.userId]);

      return NextResponse.json({
        message: 'Pembelian berhasil diverifikasi manual dan akun pengguna ditingkatkan ke Premium.',
        status: 'settlement'
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });

  } catch (error: any) {
    console.error('Error admin purchases PATCH:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

// DELETE: Hapus riwayat order pembelian oleh Super Admin
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pembelian wajib disertakan.' }, { status: 400 });
    }

    await pool.query('DELETE FROM "SubscriptionPurchase" WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Riwayat pembelian berhasil dihapus.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus data pembelian.' }, { status: 500 });
  }
}

