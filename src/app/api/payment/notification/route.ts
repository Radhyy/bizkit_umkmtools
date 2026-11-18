import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const notification = await req.json();
    console.log('[Midtrans Webhook] Received notification:', notification);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type
    } = notification;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    
    // Verifikasi signature key jika ada server key
    if (serverKey && signature_key) {
      const mySignature = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex');

      if (mySignature !== signature_key) {
        console.warn('[Midtrans Webhook] Signature key tidak cocok:', { expected: mySignature, received: signature_key });
        return NextResponse.json({ error: 'Invalid signature key' }, { status: 403 });
      }
    }

    // Tentukan status akhir
    let finalStatus = 'pending';
    if (transaction_status === 'capture') {
      finalStatus = fraud_status === 'challenge' ? 'challenge' : 'settlement';
    } else if (transaction_status === 'settlement') {
      finalStatus = 'settlement';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      finalStatus = transaction_status;
    } else if (transaction_status === 'pending') {
      finalStatus = 'pending';
    }

    // 1. Update status pesanan di database SubscriptionPurchase
    const updatePurchaseRes = await pool.query(`
      UPDATE "SubscriptionPurchase"
      SET 
        status = $1,
        "paymentMethod" = COALESCE($2, "paymentMethod"),
        "midtransResponse" = $3,
        "paidAt" = CASE WHEN $1 = 'settlement' THEN NOW() ELSE "paidAt" END,
        "updatedAt" = NOW()
      WHERE "orderId" = $4
      RETURNING "userId", plan, "couponCode"
    `, [
      finalStatus,
      payment_type || null,
      JSON.stringify(notification),
      order_id
    ]);

    // 2. Jika status settlement, aktifkan Premium pada pengguna dan catat kupon
    if (finalStatus === 'settlement' && updatePurchaseRes.rows.length > 0) {
      const purchase = updatePurchaseRes.rows[0];
      const userId = purchase.userId;

      await pool.query(`
        UPDATE "User"
        SET 
          role = 'premium',
          "isLocked" = false,
          "trialEndsAt" = NULL,
          "trialGrantedDays" = 0,
          "updatedAt" = NOW()
        WHERE id = $1
      `, [userId]);

      // Tambah usageCount kupon jika ada
      if (purchase.couponCode) {
        await pool.query(`
          UPDATE "DiscountCoupon"
          SET "usageCount" = "usageCount" + 1, "updatedAt" = NOW()
          WHERE UPPER(code) = UPPER($1)
        `, [purchase.couponCode]);
      }

      console.log(`[Midtrans Webhook] Akun ${userId} berhasil di-upgrade ke Premium via order ${order_id}.`);
    }

    return NextResponse.json({ success: true, message: 'Notification processed' }, { status: 200 });

  } catch (err: any) {
    console.error('[Midtrans Webhook] Error processing notification:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

