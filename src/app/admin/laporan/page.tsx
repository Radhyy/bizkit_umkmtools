'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  IconChartBar,
  IconReceipt,
  IconCalendarEvent,
  IconRefresh,
  IconDownload,
  IconSearch,
  IconTrendingUp,
  IconCreditCard,
  IconCash,
  IconBuildingStore,
  IconUsers,
  IconCheck,
  IconAlertCircle,
  IconTag,
  IconWallet,
  IconCopy
} from '@tabler/icons-react';

interface PurchaseItem {
  id: string;
  orderId: string;
  userId: string;
  plan: 'monthly' | 'yearly';
  amount: number | string;
  discountAmount: number | string;
  couponCode: string | null;
  paymentMethod: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string;
  namaUsaha: string | null;
  kotaLokasi: string | null;
}

interface FinancialStats {
  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  finalNetProfit: number;
  estimatedGatewayFee: number;
  mrr: number;
  arr: number;
  aov: number;
  totalOrders: number;
  monthlyCount: number;
  yearlyCount: number;
  activePremiumCount: number;
}

interface ChartDataPoint {
  period: string;
  net: number;
  gross: number;
  orders: number;
}

const METHOD_LABELS: Record<string, string> = {
  'qris': 'QRIS & E-Wallet',
  'bca_va': 'BCA Virtual Account',
  'mandiri_va': 'Mandiri VA',
  'bni_va': 'BNI VA',
  'bri_va': 'BRI VA',
  'credit_card': 'Kartu Kredit / Debit',
  'all': 'Lainnya'
};

export default function AdminLaporanPage() {
  const [stats, setStats] = useState<FinancialStats>({
    grossRevenue: 0,
    totalDiscount: 0,
    netRevenue: 0,
    finalNetProfit: 0,
    estimatedGatewayFee: 0,
    mrr: 0,
    arr: 0,
    aov: 0,
    totalOrders: 0,
    monthlyCount: 0,
    yearlyCount: 0,
    activePremiumCount: 0
  });

  const [methodBreakdown, setMethodBreakdown] = useState<Record<string, number>>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<'all' | 'month' | '30days' | 'year'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Financial Report
  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/financial-report?range=${dateRange}`);
      if (!res.ok) throw new Error('Gagal memuat laporan finansial.');
      const data = await res.json();
      setStats(data.stats);
      setMethodBreakdown(data.methodBreakdown || {});
      setChartData(data.chartData || []);
      setPurchases(data.purchases || []);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal memuat laporan finansial.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase();
    return purchases.filter((item) => (
      item.orderId.toLowerCase().includes(q) ||
      item.userEmail.toLowerCase().includes(q) ||
      (item.userName && item.userName.toLowerCase().includes(q)) ||
      (item.namaUsaha && item.namaUsaha.toLowerCase().includes(q)) ||
      (item.couponCode && item.couponCode.toLowerCase().includes(q))
    ));
  }, [purchases, searchQuery]);

  // Ekspor ke CSV
  const handleExportCSV = () => {
    if (purchases.length === 0) {
      showToast('error', 'Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const headers = ['Order ID', 'Tanggal', 'Nama Pengguna', 'Email', 'Nama Usaha', 'Paket', 'Gross (Rp)', 'Diskon (Rp)', 'Net (Rp)', 'Kupon', 'Metode Bayar', 'Status'];
    const rows = purchases.map(p => [
      p.orderId,
      new Date(p.createdAt).toISOString().split('T')[0],
      `"${p.userName || ''}"`,
      p.userEmail,
      `"${p.namaUsaha || ''}"`,
      p.plan === 'yearly' ? 'Tahunan' : 'Bulanan',
      Number(p.amount) + Number(p.discountAmount || 0),
      Number(p.discountAmount || 0),
      Number(p.amount),
      p.couponCode || '-',
      p.paymentMethod,
      p.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Finansial_Bizkit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'Laporan finansial CSV berhasil diunduh!');
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-semibold transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <IconAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Laporan Finansial
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Analisis arus kas berlangganan, rincian omzet, estimasi MRR, dan ekspor pembukuan platform secara realtime.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          
          {/* Rentang Tanggal Filter */}
          <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-xl text-xs font-medium text-zinc-500">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dateRange === 'all' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dateRange === '30days' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dateRange === 'month' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-3 py-1 rounded-lg transition-all ${
                dateRange === 'year' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Tahun Ini
            </button>
          </div>

          {/* Refresh Data */}
          <button 
            onClick={fetchReport}
            title="Sinkronkan data"
            disabled={isLoading}
            className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
          </button>

          {/* Ekspor Laporan CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-xs transition-all text-xs cursor-pointer"
          >
            <IconDownload className="w-3.5 h-3.5" stroke={2.5} />
            <span>Ekspor CSV</span>
          </button>

        </div>
      </div>

      {/* Unified 4-Metric Financial KPI Strip */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* Total Pendapatan Bersih */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Pendapatan Bersih (Net)</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconCash className="w-3 h-3" /> Masuk
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {stats.netRevenue.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Bruto: Rp {stats.grossRevenue.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Monthly Recurring Revenue (MRR) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">MRR (Recurring)</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded">
                <IconTrendingUp className="w-3 h-3" /> Proyeksi
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {stats.mrr.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-blue-600 font-medium mt-1">
                Dari {stats.activePremiumCount} pelanggan premium
              </div>
            </div>
          </div>

          {/* Annual Run Rate (ARR) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">ARR (Tahunan)</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-600 bg-purple-50/80 px-1.5 py-0.5 rounded">
                <IconWallet className="w-3 h-3" /> ARR (12x)
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {stats.arr.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Estimasi omzet tahunan
              </div>
            </div>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Rata-rata Transaksi (AOV)</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded">
                <IconReceipt className="w-3 h-3" /> Per Order
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {stats.aov.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Dari {stats.totalOrders} total pesanan lunas
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Row 2: Visual Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grafik Pendapatan Bersih (2 Kolom) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Tren Pendapatan Berlangganan</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Pertumbuhan nominal transaksi per periode</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-zinc-600">Net Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                <span className="text-zinc-600">Gross</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={{ stroke: '#f1f5f9' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, '']}
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#2563eb' }} 
                  activeDot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gross" 
                  stroke="#cbd5e1" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ringkasan Pembukuan & Fee (1 Kolom) */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">Rincian Pembukuan Kas</h3>
            <p className="text-xs text-zinc-400 mb-4">Struktur perolehan dana platform</p>

            <div className="space-y-3 text-xs">
              
              <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Nilai Bruto Pesanan</span>
                <span className="font-bold text-zinc-900">
                  Rp {stats.grossRevenue.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                <span className="text-zinc-500 flex items-center gap-1">
                  <IconTag className="w-3.5 h-3.5 text-emerald-600" />
                  Potongan Diskon Kupon
                </span>
                <span className="font-bold text-emerald-600">
                  - Rp {stats.totalDiscount.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Total Net Masuk</span>
                <span className="font-bold text-zinc-900">
                  Rp {stats.netRevenue.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-zinc-100">
                <span className="text-zinc-500 flex items-center gap-1">
                  <IconCreditCard className="w-3.5 h-3.5 text-amber-500" />
                  Estimasi Biaya Gateway (1.5%)
                </span>
                <span className="font-medium text-amber-600">
                  - Rp {stats.estimatedGatewayFee.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-zinc-800">Estimasi Bersih Diterima</span>
                <span className="font-extrabold text-blue-600 text-sm">
                  Rp {stats.finalNetProfit.toLocaleString('id-ID')}
                </span>
              </div>

            </div>
          </div>

          <div className="mt-5 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Rasio Paket:</span>
            <div className="flex gap-2 font-semibold">
              <span className="text-zinc-700">{stats.monthlyCount} Bulanan</span>
              <span>•</span>
              <span className="text-blue-600">{stats.yearlyCount} Tahunan</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Table Card (Financial Log Table) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        
        {/* Table Filters & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Riwayat Pembukuan Transaksi</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Daftar transaksi masuk yang berhasil diverifikasi sistem</p>
          </div>

          <div className="relative w-full sm:w-64">
            <IconSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Cari order ID, email, usaha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f5] border border-transparent rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Financial Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/60">
              <tr>
                <th className="px-5 py-3 font-normal">Order ID & Waktu</th>
                <th className="px-4 py-3 font-normal">Pelanggan & Usaha</th>
                <th className="px-4 py-3 font-normal">Paket</th>
                <th className="px-4 py-3 font-normal">Nilai Bruto</th>
                <th className="px-4 py-3 font-normal">Potongan Diskon</th>
                <th className="px-4 py-3 font-normal">Dana Bersih Masuk</th>
                <th className="px-4 py-3 font-normal">Metode Bayar</th>
                <th className="px-5 py-3 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-zinc-400">
                    <IconRefresh className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data pembukuan finansial...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-zinc-400">
                    <IconReceipt className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-700">Belum ada transaksi pembayaran yang tercatat.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Transaksi yang telah dibayar pelanggan akan otomatis tercatat di pembukuan ini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const gross = Number(item.amount) + Number(item.discountAmount || 0);
                  const methodLabel = METHOD_LABELS[item.paymentMethod] || item.paymentMethod;

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      
                      {/* Order ID & Waktu */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-zinc-800 font-bold text-[11px] block">
                          {item.orderId}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Pelanggan & Usaha */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-zinc-900 leading-tight">
                          {item.userName || item.userEmail.split('@')[0]}
                        </p>
                        <p className="text-[11px] text-zinc-400">{item.userEmail}</p>
                        {item.namaUsaha && (
                          <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                            <IconBuildingStore className="w-3 h-3 text-zinc-400" />
                            <span>{item.namaUsaha}</span>
                          </p>
                        )}
                      </td>

                      {/* Paket */}
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          {item.plan === 'yearly' ? 'Tahunan' : 'Bulanan'}
                        </span>
                      </td>

                      {/* Nilai Bruto */}
                      <td className="px-4 py-3.5 text-zinc-600 font-medium">
                        Rp {gross.toLocaleString('id-ID')}
                      </td>

                      {/* Potongan Diskon */}
                      <td className="px-4 py-3.5">
                        {Number(item.discountAmount) > 0 ? (
                          <div>
                            <span className="text-emerald-600 font-semibold">
                              - Rp {Number(item.discountAmount).toLocaleString('id-ID')}
                            </span>
                            {item.couponCode && (
                              <span className="block text-[10px] text-zinc-400 font-mono">
                                Kupon: {item.couponCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>

                      {/* Dana Bersih Masuk */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-zinc-900 text-sm">
                          Rp {Number(item.amount).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Metode Bayar */}
                      <td className="px-4 py-3.5 text-zinc-700 font-medium text-xs">
                        {methodLabel}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Settlement
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

