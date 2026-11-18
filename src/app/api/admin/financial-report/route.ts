import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all'; // 'month', '30days', 'year', 'all'

    // Ambil semua transaksi sukses
    let dateFilter = '';
    if (range === 'month') {
      dateFilter = `AND sp."createdAt" >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (range === '30days') {
      dateFilter = `AND sp."createdAt" >= NOW() - INTERVAL '30 days'`;
    } else if (range === 'year') {
      dateFilter = `AND sp."createdAt" >= DATE_TRUNC('year', CURRENT_DATE)`;
    }

    const successfulPurchasesRes = await pool.query(`
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
        sp."paidAt",
        sp."createdAt",
        u.name as "userName",
        u.email as "userEmail",
        u."namaUsaha",
        u."kotaLokasi"
      FROM "SubscriptionPurchase" sp
      LEFT JOIN "User" u ON sp."userId" = u.id
      WHERE sp.status IN ('settlement', 'capture', 'success')
      ${dateFilter}
      ORDER BY sp."createdAt" DESC
    `);

    const purchases = successfulPurchasesRes.rows;

    // Kalkulasi metrik finansial
    let grossRevenue = 0;
    let totalDiscount = 0;
    let netRevenue = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    const methodBreakdown: Record<string, number> = {};

    purchases.forEach((p) => {
      const amt = Number(p.amount) || 0;
      const disc = Number(p.discountAmount) || 0;
      const gross = amt + disc;

      grossRevenue += gross;
      totalDiscount += disc;
      netRevenue += amt;

      if (p.plan === 'yearly') yearlyCount++;
      else monthlyCount++;

      const method = p.paymentMethod || 'other';
      methodBreakdown[method] = (methodBreakdown[method] || 0) + amt;
    });

    // Hitung estimasi MRR (Monthly Recurring Revenue) dari pengguna aktif
    const activePremiumUsersRes = await pool.query(`
      SELECT COUNT(*) as count FROM "User" WHERE role = 'premium'
    `);
    const activePremiumCount = parseInt(activePremiumUsersRes.rows[0]?.count || '0', 10);

    const mrr = activePremiumCount * 49000;
    const arr = mrr * 12;
    const aov = purchases.length > 0 ? Math.round(netRevenue / purchases.length) : 0;
    const estimatedGatewayFee = Math.round(netRevenue * 0.015);
    const finalNetProfit = netRevenue - estimatedGatewayFee;

    // Chart Data bulanan
    const chartRes = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as period,
        DATE_TRUNC('month', "createdAt") as raw_date,
        COALESCE(SUM(amount), 0) as total_net,
        COALESCE(SUM(amount + "discountAmount"), 0) as total_gross,
        COUNT(*) as order_count
      FROM "SubscriptionPurchase"
      WHERE status IN ('settlement', 'capture', 'success')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY raw_date ASC
      LIMIT 12
    `);

    let chartData = chartRes.rows.map((row) => ({
      period: row.period,
      net: Number(row.total_net),
      gross: Number(row.total_gross),
      orders: Number(row.order_count)
    }));

    if (chartData.length === 0) {
      const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
      chartData = months.map(m => ({
        period: `${m} 2026`,
        net: 0,
        gross: 0,
        orders: 0
      }));
    }

    return NextResponse.json({
      success: true,
      stats: {
        grossRevenue,
        totalDiscount,
        netRevenue,
        finalNetProfit,
        estimatedGatewayFee,
        mrr,
        arr,
        aov,
        totalOrders: purchases.length,
        monthlyCount,
        yearlyCount,
        activePremiumCount
      },
      methodBreakdown,
      chartData,
      purchases
    });
  } catch (error: any) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json({ error: 'Gagal memuat laporan finansial.' }, { status: 500 });
  }
}
