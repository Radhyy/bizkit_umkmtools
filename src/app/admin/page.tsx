'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  IconCalendarEvent, 
  IconChevronDown,
  IconArrowUpRight,
  IconArrowDownRight,
  IconStarFilled,
  IconDots,
  IconSearch,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconShieldCheck,
  IconCrown,
  IconUsers,
  IconShoppingBag,
  IconBuildingStore,
  IconReceipt,
  IconCreditCard,
  IconTrendingUp,
  IconCash
} from '@tabler/icons-react';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: 'free' | 'premium' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

interface OverviewMetrics {
  totalNetRevenue: number;
  totalGrossRevenue: number;
  totalDiscountGiven: number;
  netProfit: number;
  estimatedGatewayFee: number;
  totalOrders: number;
  aov: number;
  mrr: number;
  arr: number;
  monthlyOrdersCount: number;
  yearlyOrdersCount: number;
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
}

interface ChartMonthItem {
  month: string;
  thisYearOrders: number;
  thisYearRev: number;
  lastYearOrders: number;
  lastYearRev: number;
}

interface CategoryItem {
  name: string;
  revenue: string;
  rawAmount: number;
  percentage: number;
  count: number;
}

interface RecentTransaction {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  businessName: string;
  location: string;
  plan: string;
  amount: number;
  discountAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

// Tooltip grafik yang disesuaikan dengan Rupiah / Jumlah Pesanan
const CustomChartTooltip = ({ active, payload, label, chartMetric }: any) => {
  if (active && payload && payload.length) {
    const isOrders = chartMetric === 'orders';
    const thisYearVal = payload.find((p: any) => p.dataKey === 'thisYearOrders' || p.dataKey === 'thisYearRev')?.value;

    const formattedThis = isOrders 
      ? `${thisYearVal || 0} pesanan` 
      : `Rp ${Number(thisYearVal || 0).toLocaleString('id-ID')}`;

    return (
      <div className="bg-[#18181b] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 whitespace-nowrap border border-zinc-700">
        <span className="font-bold">{label}</span>
        <span className="text-zinc-500">•</span>
        <span className="text-blue-400">{formattedThis}</span>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [chartMetric, setChartMetric] = useState<'orders' | 'revenue'>('revenue');
  const [activeTab, setActiveTab] = useState<'transactions' | 'users'>('transactions');
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);

  // Real Database Overview Data
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalNetRevenue: 0,
    totalGrossRevenue: 0,
    totalDiscountGiven: 0,
    netProfit: 0,
    estimatedGatewayFee: 0,
    totalOrders: 0,
    aov: 0,
    mrr: 0,
    arr: 0,
    monthlyOrdersCount: 0,
    yearlyOrdersCount: 0,
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
  });

  const [chartData, setChartData] = useState<ChartMonthItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  // Users Data
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'free' | 'premium' | 'admin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch Real Overview Data
  const fetchOverviewData = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.metrics);
        setChartData(data.chartData || []);
        setCategories(data.categories || []);
        setRecentTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data ringkasan admin:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Gagal mengambil data user:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'free' | 'premium' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah role');

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setNotification({ message: `Role berhasil diubah menjadi ${newRole.toUpperCase()}`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      fetchOverviewData();
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  const formatRupiah = (val: number) => {
    return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {notification.type === 'success' ? <IconCheck className="w-4 h-4 text-emerald-600" /> : <IconAlertCircle className="w-4 h-4 text-rose-600" />}
          {notification.message}
        </div>
      )}

      {/* Header Section: "Overview" + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Overview</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ringkasan data riil platform Bizkit dari database PostgreSQL Neon.
          </p>
        </div>

        {/* Controls on the Right */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium shadow-2xs">
            <IconCalendarEvent className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tahun {new Date().getFullYear()}</span>
          </div>

          <button 
            onClick={() => { fetchOverviewData(); fetchUsers(); }}
            disabled={isLoadingOverview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer"
          >
            <IconRefresh className={`w-3.5 h-3.5 text-zinc-500 ${isLoadingOverview ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 5-Column Metric Cards in One Bordered Container (Real Data in Rupiah) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* 1. Pendapatan Bersih (Net Revenue) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2 h-6">
              <span className="text-xs font-medium text-zinc-500 truncate" title="Pendapatan Bersih">
                Pendapatan Bersih
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                <IconArrowUpRight className="w-3 h-3" /> Realtime
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(metrics.totalNetRevenue)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                Bruto: {formatRupiah(metrics.totalGrossRevenue)}
              </div>
            </div>
          </div>

          {/* 2. Total Transaksi (Orders) */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2 h-6">
              <span className="text-xs font-medium text-zinc-500 truncate" title="Transaksi Lunas">
                Transaksi Lunas
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                <IconShoppingBag className="w-3 h-3" /> Sukses
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {metrics.totalOrders} <span className="text-xs font-medium text-zinc-500">order</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                {metrics.monthlyOrdersCount} Bln • {metrics.yearlyOrdersCount} Thn
              </div>
            </div>
          </div>

          {/* 3. Avg. order value (AOV) - Rapi & Tidak Wrapping */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2 h-6">
              <span className="text-xs font-medium text-zinc-500 truncate" title="Rata-rata Order">
                Rata-rata Order
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                AOV
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(metrics.aov)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                Diskon: {formatRupiah(metrics.totalDiscountGiven)}
              </div>
            </div>
          </div>

          {/* 4. Estimasi MRR */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-2 h-6">
              <span className="text-xs font-medium text-zinc-500 truncate" title="Estimasi MRR">
                Estimasi MRR
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                <IconCrown className="w-3 h-3" /> Berulang
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-indigo-600 tracking-tight">
                {formatRupiah(metrics.mrr)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                ARR: {formatRupiah(metrics.arr)}
              </div>
            </div>
          </div>

          {/* 5. Profit Bersih */}
          <div className="p-4 sm:p-5 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center justify-between gap-1 mb-2 h-6">
              <span className="text-xs font-medium text-zinc-500 truncate" title="Laba Bersih">
                Laba Bersih
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                Net Profit
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-emerald-700 tracking-tight">
                {formatRupiah(metrics.netProfit)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 truncate">
                Gateway fee: {formatRupiah(metrics.estimatedGatewayFee)}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Middle Section: Orders/Revenue Chart (Left) + Revenue by Category (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Line Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
          
          {/* Header of Chart Card */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {chartMetric === 'orders' ? 'Tren Transaksi Bulanan' : 'Tren Pendapatan Bulanan'}
              </h2>
              <p className="text-xs text-zinc-400">
                Data akumulasi transaksi berhasil sepanjang tahun {new Date().getFullYear()}
              </p>
            </div>

            {/* Segmented Switch: Revenue | Orders */}
            <div className="bg-[#f4f4f5] p-0.5 rounded-xl flex items-center text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'revenue' 
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Pendapatan
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'orders' 
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Pesanan
              </button>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex items-center gap-5 mb-5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-[#2563eb] rounded-full inline-block"></span>
              <span className="font-medium text-zinc-700">
                Tahun Ini: {chartMetric === 'orders' ? `${metrics.totalOrders} transaksi` : formatRupiah(metrics.totalNetRevenue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-zinc-500">
                {metrics.premiumUsers} Pelanggan Premium Aktif
              </span>
            </div>
          </div>

          {/* Recharts Curve Line */}
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (chartMetric === 'orders') return `${val}`;
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip 
                  content={<CustomChartTooltip chartMetric={chartMetric} />}
                  cursor={{ stroke: '#f4f4f5', strokeWidth: 1.5 }}
                />
                {/* Real Data Curve Line */}
                <Line 
                  type="monotone" 
                  dataKey={chartMetric === 'orders' ? 'thisYearOrders' : 'thisYearRev'} 
                  stroke="#2563eb" 
                  strokeWidth={2.4} 
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Revenue by Payment Method / Category */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900">Distribusi Metode Pembayaran</h2>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {categories.length} Metode
              </span>
            </div>
            
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center text-xs">
                  {/* Category Name */}
                  <span className="font-medium text-zinc-700 w-32 truncate" title={cat.name}>
                    {cat.name}
                  </span>
                  
                  {/* Progress Bar */}
                  <div className="flex-1 mx-3 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(5, cat.percentage)}%` }}
                    />
                  </div>
                  
                  {/* Revenue Value & Percentage */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-zinc-900 text-right w-20 truncate">
                      {cat.revenue}
                    </span>
                    <span className="text-zinc-400 text-right w-8">{cat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 mt-5 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Total Pelanggan: <strong>{metrics.totalUsers} UMKM</strong></span>
            <Link href="/admin/pembelian" className="text-blue-600 font-semibold hover:underline">
              Lihat Rincian Pembelian →
            </Link>
          </div>
        </div>

      </div>

      {/* View Switcher: Recent Transactions OR Platform Users */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`text-sm font-bold pb-2 -mb-3 transition-colors cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-zinc-900 border-b-2 border-zinc-900'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            Transaksi Berlangganan Terkini
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`text-sm font-bold pb-2 -mb-3 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'text-zinc-900 border-b-2 border-zinc-900'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <span>Pengguna Platform</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-full font-bold">
              {users.length}
            </span>
          </button>
        </div>

        {activeTab === 'transactions' && (
          <Link
            href="/admin/pembelian"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Semua Pembelian ({metrics.totalOrders}) →
          </Link>
        )}

        {activeTab === 'users' && (
          <div className="flex items-center gap-2">
            <Link
              href="/admin/pengguna"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Kelola Pengguna Penuh & Trial →
            </Link>
            <button 
              onClick={fetchUsers}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <IconRefresh className="w-3.5 h-3.5" /> Refresh Database
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Real-time Recent Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <th className="px-5 py-3 w-10 text-zinc-400 font-normal">#</th>
                  <th className="px-4 py-3 font-normal">Order ID</th>
                  <th className="px-4 py-3 font-normal">Pelanggan & Usaha</th>
                  <th className="px-4 py-3 font-normal">Paket</th>
                  <th className="px-4 py-3 font-normal">Metode Bayar</th>
                  <th className="px-4 py-3 font-normal">Nominal Bersih</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal">Tanggal</th>
                  <th className="px-4 py-3 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-zinc-400">
                      Belum ada transaksi langganan yang tercatat di database.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx, idx) => {
                    const isSettled = ['settlement', 'capture', 'success'].includes(trx.status.toLowerCase());
                    const isPending = trx.status.toLowerCase() === 'pending';

                    return (
                      <tr key={trx.id} className="hover:bg-zinc-50/70 transition-colors">
                        {/* Index */}
                        <td className="px-5 py-3.5 text-zinc-400 font-normal">{idx + 1}</td>

                        {/* Order ID */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-zinc-800 font-semibold text-[11px]">
                            {trx.orderId}
                          </span>
                        </td>

                        {/* Customer & Business */}
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-semibold text-zinc-900 leading-tight">
                              {trx.customerName}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {trx.businessName} {trx.location && `• ${trx.location}`}
                            </p>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                            <IconCrown className="w-3.5 h-3.5 text-amber-500" />
                            {trx.plan}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="px-4 py-3.5 text-zinc-600 font-medium">
                          {trx.paymentMethod}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-zinc-900">
                            {formatRupiah(trx.amount)}
                          </span>
                          {trx.discountAmount > 0 && (
                            <span className="text-[10px] text-emerald-600 block">
                              Diskon {formatRupiah(trx.discountAmount)}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isSettled && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Lunas (Settlement)
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Menunggu Bayar
                            </span>
                          )}
                          {!isSettled && !isPending && (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px] border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              {trx.status}
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-zinc-500 text-[11px]">
                          {new Date(trx.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Action Link */}
                        <td className="px-4 py-3.5 text-right">
                          <Link 
                            href="/admin/pembelian"
                            className="text-zinc-400 hover:text-blue-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors inline-block"
                            title="Buka detail pembelian"
                          >
                            <IconDots className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Real-time User Management Table (PostgreSQL Active Data) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          
          {/* Filter Bar */}
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterRole === 'all' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Semua ({users.length})
              </button>
              <button
                onClick={() => setFilterRole('premium')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterRole === 'premium' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Premium ({users.filter(u => u.role === 'premium').length})
              </button>
              <button
                onClick={() => setFilterRole('free')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterRole === 'free' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Free ({users.filter(u => u.role === 'free').length})
              </button>
              <button
                onClick={() => setFilterRole('admin')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterRole === 'admin' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Admin ({users.filter(u => u.role === 'admin').length})
              </button>
            </div>

            <div className="relative">
              <IconSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="pl-9 pr-3 py-1.5 text-xs border border-zinc-200 rounded-xl w-full sm:w-64 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <th className="px-5 py-3">Nama</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role Aktif</th>
                  <th className="px-4 py-3">Verifikasi</th>
                  <th className="px-4 py-3">Terdaftar</th>
                  <th className="px-4 py-3 text-right">Ubah Hak Akses Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                      Memuat data pengguna dari database PostgreSQL...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-400">
                      Tidak ada pengguna yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-5 py-3 font-semibold text-zinc-900">
                        {u.name || 'Tanpa Nama'}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'premium'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isVerified ? (
                          <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <IconCheck className="w-3.5 h-3.5" /> Terverifikasi
                          </span>
                        ) : (
                          <span className="text-amber-500 font-medium">Pending OTP</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          disabled={updatingUserId === u.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                          className="text-xs border border-zinc-200 rounded-lg px-2 py-1 bg-white font-medium text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer disabled:opacity-50"
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
