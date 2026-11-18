import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const VALID_COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  'BIZKITHEMAT': { type: 'percent', value: 20, label: 'Diskon 20%' },
  'UMKMMAJU': { type: 'fixed', value: 15000, label: 'Potongan Rp 15.000' },
  'SUPERADMIN': { type: 'percent', value: 50, label: 'Diskon Spesial 50%' },
  'LAUNCHING': { type: 'fixed', value: 10000, label: 'Potongan Rp 10.000' },
  'BIZKITPROMO': { type: 'percent', value: 10, label: 'Diskon 10%' },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, plan = 'monthly', couponCode, paymentMethod = 'all' } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'Pengguna tidak teridentifikasi. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    // 1. Ambil data user dari database
    let userQuery = '';
    let userParams: any[] = [];
    if (userId) {
      userQuery = 'SELECT id, name, email, role, "isLocked" FROM "User" WHERE id = $1 LIMIT 1';
      userParams = [userId];
    } else {
      userQuery = 'SELECT id, name, email, role, "isLocked" FROM "User" WHERE LOWER(email) = LOWER($1) LIMIT 1';
      userParams = [email];
    }

    const userResult = await pool.query(userQuery, userParams);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Data pengguna tidak ditemukan.' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // 2. Cegah pembelian jika role sudah premium atau admin
    if (user.role === 'premium') {
      return NextResponse.json({ 
        error: 'Akun Anda sudah memiliki status Premium Aktif. Tidak perlu melakukan pembelian lagi.',
        alreadyPremium: true 
      }, { status: 400 });
    }

    if (user.role === 'admin' || user.email?.toLowerCase() === 'radiaakbarradia@gmail.com') {
      return NextResponse.json({ 
        error: 'Akun Administrator memiliki akses penuh tanpa perlu berlangganan.',
        alreadyAdmin: true 
      }, { status: 400 });
    }

    // 3. Tentukan harga dasar
    const isYearly = plan === 'yearly';
    const basePrice = isYearly ? 468000 : 49000;
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      if (VALID_COUPONS[cleanCode]) {
        const coupon = VALID_COUPONS[cleanCode];
        if (coupon.type === 'percent') {
          discountAmount = Math.round((basePrice * coupon.value) / 100);
        } else {
          discountAmount = coupon.value;
        }
        appliedCoupon = cleanCode;
      }
    }

    const finalAmount = Math.max(10000, basePrice - discountAmount);
    const orderId = `BIZKIT-PREM-${Date.now()}-${user.id.substring(0, 6)}`;

    // 4. Konfigurasi metode pembayaran untuk Midtrans Snap
    let enabledPayments: string[] | undefined = undefined;
    switch (paymentMethod) {
      case 'qris':
        enabledPayments = ['gopay', 'shopeepay', 'qris'];
        break;
      case 'bca_va':
        enabledPayments = ['bca_va'];
        break;
      case 'mandiri_va':
        enabledPayments = ['echannel'];
        break;
      case 'bni_va':
        enabledPayments = ['bni_va'];
        break;
      case 'bri_va':
        enabledPayments = ['bri_va'];
        break;
      case 'credit_card':
        enabledPayments = ['credit_card'];
        break;
      case 'all':
      default:
        enabledPayments = undefined;
        break;
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const snapUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const snapPayload: any = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalAmount,
      },
      customer_details: {
        first_name: user.name || 'Pelanggan UMKM',
        email: user.email,
      },
      item_details: [
        {
          id: plan,
          price: finalAmount,
          quantity: 1,
          name: isYearly ? 'Bizkit Premium (1 Tahun)' : 'Bizkit Premium (1 Bulan)',
        },
      ],
    };

    if (enabledPayments && enabledPayments.length > 0) {
      snapPayload.enabled_payments = enabledPayments;
    }

    const midtransRes = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(snapPayload),
    });

    const midtransData = await midtransRes.json();

    if (!midtransRes.ok || !midtransData.token) {
      console.error('Gagal membuat transaksi Midtrans:', midtransData);
      return NextResponse.json({ 
        error: midtransData.message || 'Gagal menghubungi server pembayaran Midtrans.',
        details: midtransData
      }, { status: 500 });
    }

    // Catat riwayat pembelian ke tabel SubscriptionPurchase
    try {
      const purchaseId = uuidv4();
      await pool.query(`
        INSERT INTO "SubscriptionPurchase" (
          id, "orderId", "userId", plan, amount, "discountAmount", "couponCode", 
          "paymentMethod", status, "snapToken", "snapRedirectUrl", "midtransResponse", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, NOW(), NOW())
      `, [
        purchaseId,
        orderId,
        user.id,
        plan,
        finalAmount,
        discountAmount,
        appliedCoupon,
        paymentMethod,
        midtransData.token,
        midtransData.redirect_url,
        JSON.stringify(midtransData)
      ]);
    } catch (dbErr) {
      console.error('Gagal mencatat SubscriptionPurchase:', dbErr);
    }

    return NextResponse.json({
      success: true,
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      orderId,
      basePrice,
      discountAmount,
      finalAmount,
      appliedCoupon,
      plan: isYearly ? 'yearly' : 'monthly'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error create-transaction route:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem saat memproses transaksi.' }, { status: 500 });
  }
}

