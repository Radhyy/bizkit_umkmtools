import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Helper verifikasi Super Admin
async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return { authorized: false, error: 'Unauthorized: Harap login terlebih dahulu.' };
  }

  const userRes = await pool.query(
    'SELECT id, name, email, role, "isSuperAdmin" FROM "User" WHERE id = $1',
    [sessionToken]
  );

  if (userRes.rows.length === 0) {
    return { authorized: false, error: 'Unauthorized: Pengguna tidak ditemukan.' };
  }

  const user = userRes.rows[0];
  const isSuperAdmin = user.isSuperAdmin || user.role === 'admin' || user.email === 'radiaakbarradia@gmail.com';

  if (!isSuperAdmin) {
    return { authorized: false, error: 'Forbidden: Hanya Super Admin yang diizinkan.' };
  }

  return { authorized: true, user };
}

// GET: Ambil daftar kode diskon dan statistik kupon
export async function GET(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const couponsRes = await pool.query(`
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
        "isActive",
        "createdAt",
        "updatedAt"
      FROM "DiscountCoupon"
      ORDER BY "createdAt" DESC
    `);

    const coupons = couponsRes.rows;

    // Hitung total penggunaan dan perkiraan diskon dari SubscriptionPurchase
    const usageRes = await pool.query(`
      SELECT 
        COALESCE(SUM("discountAmount"), 0) as total_discount_given,
        COUNT(*) as total_used_orders
      FROM "SubscriptionPurchase"
      WHERE "couponCode" IS NOT NULL AND status IN ('settlement', 'capture', 'success')
    `);

    const totalDiscountGiven = Number(usageRes.rows[0]?.total_discount_given || 0);
    const totalUsedOrders = Number(usageRes.rows[0]?.total_used_orders || 0);

    const now = new Date();
    const activeCoupons = coupons.filter(c => {
      if (!c.isActive) return false;
      if (c.validUntil && new Date(c.validUntil) < now) return false;
      if (c.usageLimit && c.usageCount >= c.usageLimit) return false;
      return true;
    });

    const stats = {
      totalCoupons: coupons.length,
      activeCoupons: activeCoupons.length,
      totalUsageCount: coupons.reduce((acc, c) => acc + (Number(c.usageCount) || 0), 0) || totalUsedOrders,
      totalDiscountGiven: totalDiscountGiven
    };

    return NextResponse.json({
      success: true,
      coupons,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar kupon diskon' }, { status: 500 });
  }
}

// POST: Buat kode diskon baru
export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      name,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      validUntil,
      isActive
    } = body;

    if (!code || !name || !discountValue) {
      return NextResponse.json({ error: 'Kode, nama promo, dan nilai diskon wajib diisi.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      return NextResponse.json({ error: 'Format kode diskon tidak valid.' }, { status: 400 });
    }

    const type = discountType === 'fixed' ? 'fixed' : 'percent';
    const value = Number(discountValue);

    if (isNaN(value) || value <= 0) {
      return NextResponse.json({ error: 'Nilai diskon harus berupa angka lebih besar dari 0.' }, { status: 400 });
    }

    if (type === 'percent' && value > 100) {
      return NextResponse.json({ error: 'Diskon persentase tidak boleh lebih dari 100%.' }, { status: 400 });
    }

    // Cek duplikasi kode
    const existing = await pool.query('SELECT id FROM "DiscountCoupon" WHERE code = $1', [cleanCode]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: `Kode kupon "${cleanCode}" sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const id = uuidv4();
    const insertRes = await pool.query(`
      INSERT INTO "DiscountCoupon" (
        id, code, name, "discountType", "discountValue", "minPurchase",
        "maxDiscount", "usageLimit", "usageCount", "validUntil", "isActive",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      id,
      cleanCode,
      name.trim(),
      type,
      value,
      Number(minPurchase) || 0,
      maxDiscount ? Number(maxDiscount) : null,
      usageLimit ? parseInt(usageLimit, 10) : null,
      validUntil ? new Date(validUntil) : null,
      isActive !== false
    ]);

    return NextResponse.json({
      success: true,
      coupon: insertRes.rows[0],
      message: `Kode diskon ${cleanCode} berhasil dibuat!`
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat kode diskon' }, { status: 500 });
  }
}

// PATCH: Perbarui kode diskon atau ubah status aktif
export async function PATCH(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID kupon diperlukan' }, { status: 400 });
    }

    if (action === 'toggle_active') {
      const updateRes = await pool.query(`
        UPDATE "DiscountCoupon"
        SET "isActive" = NOT "isActive", "updatedAt" = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (updateRes.rows.length === 0) {
        return NextResponse.json({ error: 'Kupon tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        coupon: updateRes.rows[0],
        message: `Status kupon ${updateRes.rows[0].code} berhasil diubah jadi ${updateRes.rows[0].isActive ? 'Aktif' : 'Nonaktif'}.`
      });
    }

    // Update form fields
    const {
      name,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      usageLimit,
      validUntil,
      isActive
    } = fields;

    const type = discountType === 'fixed' ? 'fixed' : 'percent';
    const value = Number(discountValue);

    const updateRes = await pool.query(`
      UPDATE "DiscountCoupon"
      SET 
        name = COALESCE($2, name),
        "discountType" = $3,
        "discountValue" = $4,
        "minPurchase" = $5,
        "maxDiscount" = $6,
        "usageLimit" = $7,
        "validUntil" = $8,
        "isActive" = $9,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      name?.trim(),
      type,
      value,
      Number(minPurchase) || 0,
      maxDiscount ? Number(maxDiscount) : null,
      usageLimit ? parseInt(usageLimit, 10) : null,
      validUntil ? new Date(validUntil) : null,
      isActive !== false
    ]);

    if (updateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Kupon tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coupon: updateRes.rows[0],
      message: `Kupon ${updateRes.rows[0].code} berhasil diperbarui!`
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui kupon' }, { status: 500 });
  }
}

// DELETE: Hapus kode diskon
export async function DELETE(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kupon diperlukan' }, { status: 400 });
    }

    const delRes = await pool.query('DELETE FROM "DiscountCoupon" WHERE id = $1 RETURNING code', [id]);

    if (delRes.rows.length === 0) {
      return NextResponse.json({ error: 'Kupon tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Kode diskon ${delRes.rows[0].code} berhasil dihapus.`
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus kupon' }, { status: 500 });
  }
}

