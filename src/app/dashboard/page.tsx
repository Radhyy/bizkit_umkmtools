'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  IconCalendarEvent, 
  IconChevronDown,
  IconArrowUpRight,
  IconArrowDownRight,
  IconDots,
  IconArrowRight,
  IconArrowDownLeft,
  IconRefresh,
} from '@tabler/icons-react';

interface TransactionItem {
  id: string;
  userId?: string;
  deskripsi: string;
  kode?: string;
  kategori: string;
  tanggal: string;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  status?: string;
  metode?: string;
  createdAt?: string;
}

interface SummaryData {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  totalTransaksi: number;
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

const formatDateIndo = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Tooltip identik: "Mei • Rp 73Jt • Rp 42Jt tahun lalu"
const CustomChartTooltip = ({ active, payload, label, chartMetric }: any) => {
  if (active && payload && payload.length) {
    const isTrx = chartMetric === 'transaksi';
    const thisYearVal = payload.find((p: any) => p.dataKey?.includes('thisYear'))?.value;
    const lastYearVal = payload.find((p: any) => p.dataKey?.includes('lastYear'))?.value || 0;

    const formattedThis = isTrx 
      ? (thisYearVal !== null && thisYearVal !== undefined ? `${thisYearVal} transaksi` : 'Tidak ada data')
      : (thisYearVal !== null && thisYearVal !== undefined ? formatRupiah(thisYearVal) : 'Tidak ada data');
    const formattedLast = isTrx 
      ? `${lastYearVal} thn lalu` 
      : `${formatRupiah(lastYearVal)} thn lalu`;

    return (
      <div className="bg-[#18181b] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 whitespace-nowrap">
        <span>{label}</span>
        <span className="text-zinc-500">•</span>
        <span className="text-blue-400">{formattedThis}</span>
        <span className="text-zinc-500">•</span>
        <span className="text-zinc-400">{formattedLast}</span>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [chartMetric, setChartMetric] = useState<'pemasukan' | 'transaksi'>('pemasukan');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldo: 0,
    totalTransaksi: 0,
  });
  const [loading, setLoading] = useState(true);

  // Ambil data real transaksi dari PostgreSQL via /api/keuangan
  const fetchDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/keuangan?userId=${userId}`);
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) {
          fetchDashboardData(u.id);
          return;
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  const pemasukanCount = useMemo(() => {
    return transactions.filter(t => t.tipe === 'masuk').length;
  }, [transactions]);

  const pengeluaranCount = useMemo(() => {
    return transactions.filter(t => t.tipe === 'keluar').length;
  }, [transactions]);

  const marginPercentage = useMemo(() => {
    if (summary.totalPemasukan <= 0) return '0.0';
    return ((summary.saldo / summary.totalPemasukan) * 100).toFixed(1);
  }, [summary]);

  // Siapkan data grafik 12 bulan berdasarkan data real database
  const monthlyChartData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const data = monthNames.map((month, idx) => ({
      month,
      thisYearTrx: idx <= currentMonthIndex ? 0 : null as number | null,
      lastYearTrx: 0,
      thisYearPemasukan: idx <= currentMonthIndex ? 0 : null as number | null,
      lastYearPemasukan: 0,
    }));

    transactions.forEach(t => {
      const d = new Date(t.tanggal);
      if (!isNaN(d.getTime())) {
        const trxYear = d.getFullYear();
        const trxMonth = d.getMonth();
        const amt = Number(t.jumlah) || 0;

        if (trxYear === currentYear && trxMonth >= 0 && trxMonth < 12) {
          if (data[trxMonth].thisYearTrx === null) data[trxMonth].thisYearTrx = 0;
          if (data[trxMonth].thisYearPemasukan === null) data[trxMonth].thisYearPemasukan = 0;

          data[trxMonth].thisYearTrx = (data[trxMonth].thisYearTrx || 0) + 1;
          if (t.tipe === 'masuk') {
            data[trxMonth].thisYearPemasukan = (data[trxMonth].thisYearPemasukan || 0) + amt;
          }
        }
      }
    });

    return data;
  }, [transactions]);

  // Hitung pemasukan per kategori dari data database nyata
  const categoryData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const pemasukanList = transactions.filter(t => t.tipe === 'masuk');
    const targetList = pemasukanList.length > 0 ? pemasukanList : transactions;
    const total = targetList.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

    const map: Record<string, number> = {};
    targetList.forEach(t => {
      const cat = t.kategori || 'Umum';
      map[cat] = (map[cat] || 0) + (Number(t.jumlah) || 0);
    });

    return Object.entries(map).map(([name, val]) => ({
      name,
      revenue: formatRupiah(val),
      percentage: total > 0 ? Math.round((val / total) * 100) : 0,
      amount: val,
    })).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [transactions]);

  // 4 transaksi keuangan terakhir real dari database
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 4);
  }, [transactions]);

  return (
    <div className="p-3.5 sm:p-8 max-w-[1280px] mx-auto space-y-4 sm:space-y-6 font-jakarta">
      
      {/* Header Row: Overview + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Overview</h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Ringkasan performa dan pembukuan bisnis UMKM Anda secara real-time</p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
          {/* Date Picker Button */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium shadow-2xs whitespace-nowrap shrink-0">
            <IconCalendarEvent className="w-3.5 h-3.5 text-zinc-400" />
            <span>Tahun Ini</span>
            <span className="text-zinc-400 hidden xs:inline">1 Jan – 31 Des {new Date().getFullYear()}</span>
          </div>

          {/* Grain Selector */}
          <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium shadow-2xs whitespace-nowrap shrink-0">
            <span>Bulanan</span>
          </div>

          {/* Comparison */}
          <div className="flex items-center gap-1 text-zinc-500 font-medium px-2 py-1.5 bg-zinc-100/80 sm:bg-transparent rounded-xl whitespace-nowrap shrink-0 text-[11px] sm:text-xs">
            <span>vs <strong className="text-zinc-700 font-semibold">Tahun Lalu</strong></span>
          </div>
        </div>
      </div>

      {/* 5-Column Metric Cards in One Bordered Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        {/* Mobile: 2x2 Clean Grid | Desktop: 5-Col Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* 1. Total Pemasukan */}
          <div className="p-3.5 sm:p-5 flex flex-col justify-between border-r md:border-r-0 border-zinc-200/80">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Pemasukan</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded shrink-0">
                <IconArrowUpRight className="w-3 h-3" /> Kas Masuk
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.totalPemasukan)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 truncate">
                {pemasukanCount > 0 ? `${pemasukanCount} transaksi masuk` : 'Belum ada transaksi'}
              </div>
            </div>
          </div>

          {/* 2. Total Pengeluaran */}
          <div className="p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded shrink-0">
                <IconArrowDownRight className="w-3 h-3" /> Kas Keluar
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.totalPengeluaran)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 truncate">
                {pengeluaranCount > 0 ? `${pengeluaranCount} transaksi keluar` : 'Belum ada pengeluaran'}
              </div>
            </div>
          </div>

          {/* 3. Laba Bersih */}
          <div className="p-3.5 sm:p-5 flex flex-col justify-between border-r md:border-r-0 border-zinc-200/80">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Laba Bersih</span>
              <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                summary.saldo >= 0 ? 'text-emerald-600 bg-emerald-50/80' : 'text-rose-500 bg-rose-50/80'
              }`}>
                {summary.saldo >= 0 ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownRight className="w-3 h-3" />}
                {summary.saldo >= 0 ? 'Surplus' : 'Defisit'}
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.saldo)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 truncate">
                {summary.totalPemasukan > 0 ? `${marginPercentage}% margin laba` : 'Saldo kas terdata'}
              </div>
            </div>
          </div>

          {/* 4. Total Transaksi */}
          <div className="p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Transaksi</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
                {summary.totalTransaksi} Trx
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {summary.totalTransaksi}
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 truncate">
                Riwayat pembukuan aktif
              </div>
            </div>
          </div>

          {/* 5. Margin Keuntungan (Desktop View Only - in Mobile, rendered as full-width sleek bottom strip) */}
          <div className="hidden md:flex p-5 flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Margin Keuntungan</span>
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                Number(marginPercentage) >= 0 ? 'text-emerald-600 bg-emerald-50/80' : 'text-rose-500 bg-rose-50/80'
              }`}>
                {Number(marginPercentage) >= 0 ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownRight className="w-3 h-3" />}
                {Number(marginPercentage) >= 0 ? 'Positif' : 'Negatif'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 tracking-tight">
                {marginPercentage}%
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {Number(marginPercentage) >= 20 ? 'Stabil & sehat' : Number(marginPercentage) > 0 ? 'Cukup stabil' : 'Perlu perhatian'}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Summary Strip: Margin Keuntungan & Status Finansial */}
        <div className="md:hidden px-3.5 py-2.5 bg-zinc-50/80 border-t border-zinc-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-500">Margin Keuntungan:</span>
            <span className="text-xs font-bold text-zinc-900">{marginPercentage}%</span>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            Number(marginPercentage) >= 0 ? 'text-emerald-700 bg-emerald-100/80' : 'text-rose-600 bg-rose-100/80'
          }`}>
            {Number(marginPercentage) >= 0 ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownRight className="w-3 h-3" />}
            {Number(marginPercentage) >= 0 ? 'Stabil & Sehat' : 'Perlu Perhatian'}
          </span>
        </div>
      </div>

      {/* Middle Section: Orders/Revenue Chart (Left) + Revenue by Category (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Line Chart */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
          
          {/* Header of Chart Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">
                {chartMetric === 'pemasukan' ? 'Tren Pemasukan per Bulan' : 'Tren Transaksi per Bulan'}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Grafik performa pembukuan tahun {new Date().getFullYear()}</p>
            </div>

            {/* Segmented Switch: Pemasukan | Transaksi */}
            <div className="bg-[#f4f4f5] p-0.5 rounded-xl flex items-center text-xs font-medium w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setChartMetric('pemasukan')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-lg transition-all text-center ${
                  chartMetric === 'pemasukan' 
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('transaksi')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-lg transition-all text-center ${
                  chartMetric === 'transaksi' 
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Transaksi
              </button>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#2563eb] rounded-full inline-block"></span>
              <span className="font-medium text-zinc-700">
                Tahun ini: {chartMetric === 'pemasukan' ? formatRupiah(summary.totalPemasukan) : `${summary.totalTransaksi} trx`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 border-t border-dashed border-zinc-400 inline-block"></span>
              <span className="text-zinc-400">
                Tahun lalu: {chartMetric === 'pemasukan' ? 'Rp 0' : '0 trx'}
              </span>
            </div>
          </div>

          {/* Recharts Curve Line */}
          <div className="h-[200px] sm:h-[230px] w-full -ml-3 sm:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={monthlyChartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10 }} 
                  dy={8} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (chartMetric === 'transaksi') return `${val}`;
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}Jt`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}Rb`;
                    return `${val}`;
                  }}
                />
                <Tooltip 
                  content={<CustomChartTooltip chartMetric={chartMetric} />}
                  cursor={{ stroke: '#f4f4f5', strokeWidth: 1.5 }}
                />
                {/* Last Year - Dashed Grey Line */}
                <Line 
                  type="monotone" 
                  dataKey={chartMetric === 'transaksi' ? 'lastYearTrx' : 'lastYearPemasukan'} 
                  stroke="#cbd5e1" 
                  strokeWidth={1.8} 
                  strokeDasharray="3 3" 
                  dot={false} 
                />
                {/* This Year - Blue Smooth Line */}
                <Line 
                  type="monotone" 
                  dataKey={chartMetric === 'transaksi' ? 'thisYearTrx' : 'thisYearPemasukan'} 
                  stroke="#2563eb" 
                  strokeWidth={2.4} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Revenue by Category Progress Bars */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 mb-4 sm:mb-5">Pemasukan per kategori</h2>
            
            {categoryData.length === 0 ? (
              <div className="py-8 sm:py-12 text-center text-xs text-zinc-400">
                Belum ada data pemasukan kategori di database.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center text-xs">
                    {/* Category Name */}
                    <span className="font-medium text-zinc-700 w-24 sm:w-32 truncate">{cat.name}</span>
                    
                    {/* Progress Bar */}
                    <div className="flex-1 mx-2.5 sm:mx-3 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#2563eb] rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                    
                    {/* Revenue Value & Percentage */}
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="font-semibold text-zinc-900 whitespace-nowrap text-right min-w-[50px] sm:min-w-[56px] text-[11px] sm:text-xs">{cat.revenue}</span>
                      <span className="text-zinc-400 text-right w-7 sm:w-8 text-[10px] sm:text-xs">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3.5 sm:pt-4 border-t border-zinc-100 mt-4 sm:mt-5 flex items-center justify-between text-[11px] text-zinc-400">
            <span>{categoryData.length} Kategori Aktif</span>
            <Link href="/dashboard/laporan" className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Laporan Lengkap</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Section: 4 Laporan Keuangan Terakhir */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">4 Laporan Keuangan Terakhir</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Riwayat pencatatan transaksi kas masuk dan kas keluar terbaru</p>
          </div>
          <Link 
            href="/dashboard/keuangan"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline self-start sm:self-auto"
          >
            <span>Buka Semua Pembukuan</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
          
          {/* Mobile Card List View (< sm) */}
          <div className="sm:hidden divide-y divide-zinc-100">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                Belum ada transaksi tercatat di database.
              </div>
            ) : (
              recentTransactions.map((trx, index) => (
                <div key={trx.id || index} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      trx.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                    }`}>
                      {trx.tipe === 'masuk' ? (
                        <IconArrowDownLeft className="w-4 h-4" stroke={2.5} />
                      ) : (
                        <IconArrowUpRight className="w-4 h-4" stroke={2.5} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 text-xs truncate">
                        {trx.deskripsi}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-zinc-100 rounded text-zinc-600 font-medium">{trx.kategori}</span>
                        <span>•</span>
                        <span>{formatDateIndo(trx.tanggal)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-bold text-xs ${
                      trx.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {trx.tipe === 'masuk' ? '+' : '-'}{formatRupiah(trx.jumlah)}
                    </span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">
                      {trx.metode || 'Tercatat'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <th className="px-5 py-3 w-10 text-zinc-400 font-normal">#</th>
                  <th className="px-4 py-3 font-normal">Keterangan Transaksi</th>
                  <th className="px-4 py-3 font-normal">Kategori</th>
                  <th className="px-4 py-3 font-normal">Tanggal</th>
                  <th className="px-4 py-3 font-normal">Arus Kas</th>
                  <th className="px-4 py-3 font-normal">Nominal</th>
                  <th className="px-4 py-3 font-normal">Metode</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-zinc-400">
                      Belum ada transaksi tercatat di database. Silakan tambahkan transaksi di menu Keuangan & Kas.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((trx, index) => (
                    <tr key={trx.id || index} className="hover:bg-zinc-50/70 transition-colors">
                      {/* Index */}
                      <td className="px-5 py-3.5 text-zinc-400 font-normal">{index + 1}</td>

                      {/* Deskripsi & Kode */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            trx.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                          }`}>
                            {trx.tipe === 'masuk' ? (
                              <IconArrowDownLeft className="w-4 h-4" stroke={2.5} />
                            ) : (
                              <IconArrowUpRight className="w-4 h-4" stroke={2.5} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 text-xs sm:text-sm leading-tight">
                              {trx.deskripsi}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {trx.kode || `TRX-${String(index + 1).padStart(4, '0')}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-3.5 text-zinc-600 font-normal">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-medium">
                          {trx.kategori}
                        </span>
                      </td>

                      {/* Tanggal */}
                      <td className="px-4 py-3.5 text-zinc-600 font-medium">
                        {formatDateIndo(trx.tanggal)}
                      </td>

                      {/* Tipe Arus Kas */}
                      <td className="px-4 py-3.5">
                        {trx.tipe === 'masuk' ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Kas Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-medium text-rose-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Kas Keluar
                          </span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="px-4 py-3.5">
                        <span className={`font-bold text-xs sm:text-sm ${
                          trx.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {trx.tipe === 'masuk' ? '+' : '-'}{formatRupiah(trx.jumlah)}
                        </span>
                      </td>

                      {/* Metode Pembayaran */}
                      <td className="px-4 py-3.5 text-zinc-600 font-medium">
                        {trx.metode || 'Tercatat'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {trx.status || 'Selesai'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <Link 
                          href="/dashboard/keuangan"
                          className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors inline-block"
                          title="Lihat Detail"
                        >
                          <IconDots className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
