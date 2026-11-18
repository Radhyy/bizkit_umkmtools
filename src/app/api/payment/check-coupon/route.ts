import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code, amount = 49000 } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'Kode kupon wajib diisi.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Query Neon PostgreSQL
    const res = await pool.query(`
      SELECT 
        id,
        code,
        name,
        "discountType",
        "discountValue",
        "minPurchase",
        "maxDiscount",
        "usageLimit",
        "usageCount",
        "validUntil",
        "isActive"
      FROM "DiscountCoupon"
      WHERE UPPER(code) = $1
    `, [cleanCode]);

    if (res.rows.length === 0) {
      return NextResponse.json({ valid: false, message: 'Kode kupon tidak ditemukan atau salah.' }, { status: 404 });
    }

    const coupon = res.rows[0];

    // Cek status aktif
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Kode kupon sudah tidak aktif.' }, { status: 400 });
    }

    // Cek tanggal kadaluarsa
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Masa berlaku kode kupon telah berakhir.' }, { status: 400 });
    }

    // Cek kuota limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: 'Kuota penggunaan kupon diskon ini telah habis.' }, { status: 400 });
    }

    // Cek minimal pembelian
    const numAmount = Number(amount) || 0;
    const minPurchase = Number(coupon.minPurchase) || 0;
    if (minPurchase > 0 && numAmount < minPurchase) {
      return NextResponse.json({ 
        valid: false, 
        message: `Minimal transaksi untuk kupon ini adalah Rp ${minPurchase.toLocaleString('id-ID')}.` 
      }, { status: 400 });
    }

    // Hitung estimasi diskon
    let discountAmount = 0;
    const discountValue = Number(coupon.discountValue);
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round((numAmount * discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = discountValue;
    }

    // Tidak boleh melebihi nilai transaksi
    if (discountAmount > numAmount) {
      discountAmount = numAmount;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: discountValue,
        discountAmount: discountAmount,
        label: coupon.discountType === 'percent' 
          ? `Diskon ${discountValue}%` 
          : `Potongan Rp ${discountValue.toLocaleString('id-ID')}`
      }
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ valid: false, message: 'Terjadi kesalahan sistem saat mengecek kupon.' }, { status: 500 });
  }
}

