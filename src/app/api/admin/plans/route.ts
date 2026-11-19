import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  getPlanConfigs,
  updatePlanPrice,
  getPlanCacheMetrics,
  flushPlanCache,
  PlanConfigItem
} from '@/lib/planCache';

// GET: Ambil daftar konfigurasi paket, metrik MRR dan status otak cache
export async function GET() {
  try {
    const plans = await getPlanConfigs();
    const cacheMetrics = getPlanCacheMetrics();

    // 1. Ambil jumlah pengguna aktif dengan role premium
    const premiumUsersRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM "User" 
      WHERE role = 'premium'
    `);
    const activeSubscribers = Number(premiumUsersRes.rows[0]?.count || 0);

    // 2. Ambil total pengguna terdaftar (untuk conversion rate)
    const totalUsersRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM "User"
    `);
    const totalUsers = Number(totalUsersRes.rows[0]?.count || 0);

    // 3. Breakdown pembelian paket aktif
    const purchasesRes = await pool.query(`
      SELECT 
        plan,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM "SubscriptionPurchase"
      WHERE status IN ('settlement', 'capture', 'success')
      GROUP BY plan
    `);

    let monthlySubsCount = 0;
    let yearlySubsCount = 0;
    let totalRevenueFromPurchases = 0;

    purchasesRes.rows.forEach(row => {
      const p = (row.plan || '').toLowerCase();
      const count = Number(row.count) || 0;
      const amt = Number(row.total_amount) || 0;
      totalRevenueFromPurchases += amt;
      if (p.includes('year') || p.includes('tahunan')) {
        yearlySubsCount += count;
      } else {
        monthlySubsCount += count;
      }
    });

    const monthlyPlan = plans.find(p => p.id === 'premium_monthly') || plans.find(p => p.billingCycle === 'monthly');
    const yearlyPlan = plans.find(p => p.id === 'premium_annual') || plans.find(p => p.billingCycle === 'annual');

    const monthlyPrice = monthlyPlan ? monthlyPlan.price : 49000;
    const yearlyPrice = yearlyPlan ? yearlyPlan.price : 468000;

    // Kalkulasi MRR (Monthly Recurring Revenue)
    // Jika ada data purchase yang tercatat, gunakan kombinasi monthly + (yearly / 12)
    // Jika tidak, proyeksikan dari total activeSubscribers * monthlyPrice
    let calculatedMRR = 0;
    if (monthlySubsCount > 0 || yearlySubsCount > 0) {
      calculatedMRR = Math.round((monthlySubsCount * monthlyPrice) + (yearlySubsCount * (yearlyPrice / 12)));
    } else if (activeSubscribers > 0) {
      calculatedMRR = Math.round(activeSubscribers * monthlyPrice);
    }

    const calculatedARR = Math.round(calculatedMRR * 12);
    const conversionRate = totalUsers > 0 ? Number(((activeSubscribers / totalUsers) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      success: true,
      plans,
      stats: {
        activeSubscribers,
        totalUsers,
        conversionRate,
        monthlySubsCount,
        yearlySubsCount,
        mrr: calculatedMRR,
        arr: calculatedARR,
        totalRevenue: totalRevenueFromPurchases,
        monthlyPrice,
        yearlyPrice
      },
      cacheMetrics
    });
  } catch (err: any) {
    console.error('Error in GET /api/admin/plans:', err);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data paket & MRR.' },
      { status: 500 }
    );
  }
}

// PATCH: Ubah harga paket langganan (database + in-memory cache update)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, price, originalPrice } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID paket tidak valid.' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json(
        { success: false, error: 'Nominal harga baru wajib diisi dan harus berupa angka valid.' },
        { status: 400 }
      );
    }

    const numericPrice = Math.max(0, Number(price));
    const numericOriginal = originalPrice !== undefined && !isNaN(Number(originalPrice))
      ? Math.max(0, Number(originalPrice))
      : undefined;

    // Update ke database sekaligus segarkan otak cache
    const updated = await updatePlanPrice(id, numericPrice, numericOriginal);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Paket dengan ID "${id}" tidak ditemukan.` },
        { status: 404 }
      );
    }

    const cacheMetrics = getPlanCacheMetrics();

    return NextResponse.json({
      success: true,
      message: `Harga untuk ${updated.name} berhasil diperbarui menjadi Rp ${updated.price.toLocaleString('id-ID')}.`,
      plan: updated,
      cacheMetrics
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/admin/plans:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengubah harga paket.' },
      { status: 500 }
    );
  }
}

// POST: Flush atau reload cache secara manual
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'flush') {
      flushPlanCache();
      const plans = await getPlanConfigs(true);
      return NextResponse.json({
        success: true,
        message: 'Otak cache berhasil di-refresh dari database Neon.',
        cacheMetrics: getPlanCacheMetrics(),
        plans
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

