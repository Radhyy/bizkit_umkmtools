import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getPlanConfigs } from '@/lib/planCache';

export async function GET() {
  try {
    // 1. Ambil seluruh transaksi sukses dari database
    const purchasesRes = await pool.query(`
      SELECT 
        sp.id,
        sp."orderId",
        sp."userId",
        sp.plan,
        sp.amount::numeric as amount,
        sp."discountAmount"::numeric as "discountAmount",
        sp."couponCode",
        sp."paymentMethod",
        sp.status,
        sp."paidAt",
        sp."createdAt",
        u.name as "userName",
        u.email as "userEmail",
        u.role as "userRole",
        bp."namaUsaha",
        bp."kotaLokasi",
        bp."kategoriBisnis"
      FROM "SubscriptionPurchase" sp
      LEFT JOIN "User" u ON sp."userId" = u.id
      LEFT JOIN "BusinessProfile" bp ON sp."userId" = bp."userId"
      ORDER BY sp."createdAt" DESC
    `);

    const allPurchases = purchasesRes.rows;
    const settledPurchases = allPurchases.filter(p => 
      ['settlement', 'capture', 'success'].includes((p.status || '').toLowerCase())
    );

    // 2. Metrik Keuangan
    let totalNetRevenue = 0;
    let totalDiscountGiven = 0;
    let totalGrossRevenue = 0;
    let monthlyOrdersCount = 0;
    let yearlyOrdersCount = 0;
    const methodMap: Record<string, { label: string; count: number; amount: number }> = {};

    const METHOD_LABELS: Record<string, string> = {
      'qris': 'QRIS & E-Wallet',
      'bca_va': 'BCA Virtual Account',
      'mandiri_va': 'Mandiri VA',
      'bni_va': 'BNI Virtual Account',
      'bri_va': 'BRI Virtual Account',
      'credit_card': 'Kartu Debit/Kredit',
      'all': 'Midtrans Gateway'
    };

    settledPurchases.forEach(p => {
      const amt = Number(p.amount) || 0;
      const disc = Number(p.discountAmount) || 0;
      totalNetRevenue += amt;
      totalDiscountGiven += disc;
      totalGrossRevenue += (amt + disc);

      const planKey = (p.plan || '').toLowerCase();
      if (planKey.includes('year') || planKey.includes('tahunan')) {
        yearlyOrdersCount++;
      } else {
        monthlyOrdersCount++;
      }

      const rawMethod = (p.paymentMethod || 'qris').toLowerCase();
      const label = METHOD_LABELS[rawMethod] || rawMethod.toUpperCase();
      if (!methodMap[rawMethod]) {
        methodMap[rawMethod] = { label, count: 0, amount: 0 };
      }
      methodMap[rawMethod].count++;
      methodMap[rawMethod].amount += amt;
    });

    const totalOrders = settledPurchases.length;
    const aov = totalOrders > 0 ? Math.round(totalNetRevenue / totalOrders) : 0;
    const estimatedGatewayFee = Math.round(totalNetRevenue * 0.015);
    const netProfit = totalNetRevenue - estimatedGatewayFee;

    // 3. Ambil data pengguna platform
    const userStatsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'premium' THEN 1 END) as premium_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'free' THEN 1 END) as free_users
      FROM "User"
    `);
    const totalUsers = Number(userStatsRes.rows[0]?.total_users || 0);
    const premiumUsers = Number(userStatsRes.rows[0]?.premium_users || 0);
    const freeUsers = Number(userStatsRes.rows[0]?.free_users || 0);

    // 4. Hitung MRR & ARR dengan harga paket dari otak cache
    const activePlans = await getPlanConfigs();
    const monthlyPlanObj = activePlans.find(p => p.id === 'premium_monthly' || p.billingCycle === 'monthly');
    const yearlyPlanObj = activePlans.find(p => p.id === 'premium_annual' || p.billingCycle === 'annual');

    const monthlyPrice = monthlyPlanObj ? monthlyPlanObj.price : 49000;
    const yearlyPrice = yearlyPlanObj ? yearlyPlanObj.price : 468000;

    const mrr = premiumUsers * monthlyPrice;
    const arr = mrr * 12;

    // 5. Tren Bulanan Riil (Jan - Des)
    const monthlyTrendRes = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month_name,
        DATE_TRUNC('month', "createdAt") as raw_date,
        COUNT(*) as order_count,
        COALESCE(SUM(amount), 0) as total_rev
      FROM "SubscriptionPurchase"
      WHERE status IN ('settlement', 'capture', 'success')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY raw_date ASC
    `);

    const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = new Map<string, { orders: number; rev: number }>();
    monthlyTrendRes.rows.forEach(r => {
      trendMap.set(r.month_name, {
        orders: Number(r.order_count) || 0,
        rev: Number(r.total_rev) || 0
      });
    });

    const monthlyChartData = monthsOfYear.map(month => {
      const data = trendMap.get(month);
      return {
        month,
        thisYearOrders: data ? data.orders : 0,
        thisYearRev: data ? data.rev : 0,
        lastYearOrders: 0,
        lastYearRev: 0,
      };
    });

    // 6. Breakdown kategori/metode pembayaran untuk visual progress bar
    const categoriesBreakdown = Object.values(methodMap).map(m => ({
      name: m.label,
      revenue: `Rp ${m.amount.toLocaleString('id-ID')}`,
      rawAmount: m.amount,
      percentage: totalNetRevenue > 0 ? Math.round((m.amount / totalNetRevenue) * 100) : 0,
      count: m.count
    })).sort((a, b) => b.rawAmount - a.rawAmount);

    // Jika belum ada data metode pembayaran, fallback ke paket
    if (categoriesBreakdown.length === 0) {
      categoriesBreakdown.push(
        { name: 'Paket Bulanan (Monthly)', revenue: `Rp ${monthlyPrice.toLocaleString('id-ID')}`, rawAmount: monthlyPrice, percentage: 80, count: 0 },
        { name: 'Paket Tahunan (Annual)', revenue: `Rp ${yearlyPrice.toLocaleString('id-ID')}`, rawAmount: yearlyPrice, percentage: 20, count: 0 }
      );
    }

    // 7. Recent Transactions (Maks 8 transaksi)
    const recentTransactions = allPurchases.slice(0, 8).map(p => ({
      id: p.id,
      orderId: p.orderId,
      customerName: p.userName || 'Pengguna Baru',
      customerEmail: p.userEmail,
      businessName: p.namaUsaha || 'Bisnis UMKM',
      location: p.kotaLokasi || 'Indonesia',
      plan: p.plan === 'yearly' ? 'Paket Tahunan' : 'Paket Bulanan',
      amount: Number(p.amount) || 0,
      discountAmount: Number(p.discountAmount) || 0,
      paymentMethod: METHOD_LABELS[p.paymentMethod?.toLowerCase()] || p.paymentMethod || 'QRIS',
      status: p.status || 'pending',
      createdAt: p.createdAt
    }));

    return NextResponse.json({
      success: true,
      metrics: {
        totalNetRevenue,
        totalGrossRevenue,
        totalDiscountGiven,
        netProfit,
        estimatedGatewayFee,
        totalOrders,
        aov,
        mrr,
        arr,
        monthlyOrdersCount,
        yearlyOrdersCount,
        totalUsers,
        premiumUsers,
        freeUsers
      },
      chartData: monthlyChartData,
      categories: categoriesBreakdown,
      recentTransactions
    });
  } catch (error: any) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat ringkasan dasbor admin.' },
      { status: 500 }
    );
  }
}

