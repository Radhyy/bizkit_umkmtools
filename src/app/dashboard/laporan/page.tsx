'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  IconRefresh, 
  IconArrowUpRight, 
  IconArrowDownLeft,
  IconDownload,
  IconPlus,
  IconArrowRight,
  IconChartBar,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeCsv,
  IconX,
  IconSearch,
  IconDots,
  IconCalendarEvent,
} from '@tabler/icons-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exportUtils';
import PdfSignatureModal from '@/components/PdfSignatureModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Transaction {
  id: string;
  userId: string;
  tipe: 'masuk' | 'keluar';
  kategori: string;
  deskripsi: string;
  jumlah: number;
  tanggal: string;
  createdAt: string;
  updatedAt: string;
}

interface SummaryData {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldo: number;
  totalTransaksi: number;
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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

// Custom Tooltip identik dengan gaya black pill modern dashboard
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const pendapatan = payload.find((p: any) => p.dataKey === 'Pendapatan')?.value || 0;
    const pengeluaran = payload.find((p: any) => p.dataKey === 'Pengeluaran')?.value || 0;

    return (
      <div className="bg-[#18181b] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xl flex flex-col gap-1 whitespace-nowrap">
        <div className="text-zinc-400 font-medium text-[11px] pb-1 border-b border-zinc-800">
          Periode: {label}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Pendapatan:
          </span>
          <span className="font-bold text-white">{formatRupiah(pendapatan)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Pengeluaran:
          </span>
          <span className="font-bold text-white">{formatRupiah(pengeluaran)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function LaporanPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldo: 0,
    totalTransaksi: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPdfSignModalOpen, setIsPdfSignModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState<string>('Nescafe');

  // Filter & tampilan
  const [chartView, setChartView] = useState<'bulanan' | 'harian'>('bulanan');
  const [categoryFilter, setCategoryFilter] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [tableFilterType, setTableFilterType] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data real dari backend
  const fetchReportData = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/keuangan?userId=${userId}`);
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
    if (!raw) {
      router.push("/login");
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (!u?.id) {
        router.push("/login");
        return;
      }
      setCurrentUser(u);
      fetchReportData(u.id);

      fetch(`/api/onboarding?userId=${u.id}`)
        .then(res => res.json())
        .then(data => {
          if (data?.profile?.namaUsaha) {
            setBusinessName(data.profile.namaUsaha);
          } else if (u.name) {
            setBusinessName(u.name);
          }
        })
        .catch(() => {});
    } catch {
      router.push("/login");
    }
  }, [router]);

  const pemasukanCount = useMemo(() => {
    return transactions.filter(t => t.tipe === 'masuk').length;
  }, [transactions]);

  const pengeluaranCount = useMemo(() => {
    return transactions.filter(t => t.tipe === 'keluar').length;
  }, [transactions]);

  // Siapkan data grafik agregasi bulanan atau per tanggal dari database nyata
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    if (chartView === 'bulanan') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentYear = new Date().getFullYear();
      
      const map: Record<number, { name: string; Pendapatan: number; Pengeluaran: number }> = {};
      monthNames.forEach((month, idx) => {
        map[idx] = { name: month, Pendapatan: 0, Pengeluaran: 0 };
      });

      transactions.forEach((trx) => {
        const d = new Date(trx.tanggal);
        if (!isNaN(d.getTime())) {
          const yr = d.getFullYear();
          const mo = d.getMonth();
          if (yr === currentYear && mo >= 0 && mo < 12) {
            const amt = Number(trx.jumlah) || 0;
            if (trx.tipe === 'masuk') {
              map[mo].Pendapatan += amt;
            } else {
              map[mo].Pengeluaran += amt;
            }
          }
        }
      });

      return Object.values(map);
    } else {
      // Harian / Per Tanggal Transaksi Riil
      const sorted = [...transactions].sort(
        (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      const map: Record<string, { name: string; Pendapatan: number; Pengeluaran: number }> = {};
      
      sorted.forEach((trx) => {
        const d = new Date(trx.tanggal);
        const label = isNaN(d.getTime()) 
          ? 'Tgl' 
          : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        if (!map[label]) {
          map[label] = { name: label, Pendapatan: 0, Pengeluaran: 0 };
        }

        const amt = Number(trx.jumlah) || 0;
        if (trx.tipe === 'masuk') {
          map[label].Pendapatan += amt;
        } else {
          map[label].Pengeluaran += amt;
        }
      });

      return Object.values(map);
    }
  }, [transactions, chartView]);

  // Kategori breakdown dengan opsi filter pemasukan/pengeluaran
  const categoryBreakdown = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    let targetTransactions = transactions;
    if (categoryFilter === 'masuk') {
      targetTransactions = transactions.filter(t => t.tipe === 'masuk');
    } else if (categoryFilter === 'keluar') {
      targetTransactions = transactions.filter(t => t.tipe === 'keluar');
    }

    const map: Record<string, number> = {};
    let totalAll = 0;

    targetTransactions.forEach(t => {
      const amt = Number(t.jumlah) || 0;
      totalAll += amt;
      const cat = t.kategori || 'Umum';
      map[cat] = (map[cat] || 0) + amt;
    });

    return Object.entries(map).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalAll > 0 ? Math.round((amount / totalAll) * 100) : 0
    })).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [transactions, categoryFilter]);

  // Filter daftar transaksi untuk tabel laporan
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter tipe
      if (tableFilterType === 'masuk' && t.tipe !== 'masuk') return false;
      if (tableFilterType === 'keluar' && t.tipe !== 'keluar') return false;

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desk = (t.deskripsi || '').toLowerCase();
        const kat = (t.kategori || '').toLowerCase();
        if (!desk.includes(q) && !kat.includes(q)) return false;
      }

      return true;
    });
  }, [transactions, tableFilterType, searchQuery]);

  return (
    <div className="p-3.5 sm:p-8 max-w-[1280px] mx-auto space-y-4 sm:space-y-6 font-jakarta">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Laporan Keuangan Bisnis</h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
            Pantau ringkasan pendapatan, pengeluaran, dan laba rugi real-time berdasarkan data transaksi Anda.
          </p>
        </div>

        {/* Action Controls: Responsive on Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          {/* Top Row on Mobile: Primary CTA Catat Transaksi + Refresh Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/dashboard/keuangan/tambah"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-xs transition-all order-1 sm:order-3"
            >
              <IconPlus className="w-3.5 h-3.5" stroke={2.5} />
              <span>Catat Transaksi</span>
            </Link>

            <button 
              onClick={() => currentUser?.id && fetchReportData(currentUser.id)}
              title="Muat ulang data"
              className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50 sm:order-1 shrink-0"
              disabled={loading}
            >
              <IconRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
            </button>
          </div>

          {/* Unduh Laporan */}
          <button 
            onClick={() => {
              if (transactions.length === 0) {
                alert("Belum ada data transaksi untuk diunduh. Silakan catat transaksi terlebih dahulu.");
                return;
              }
              setIsExportModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-colors shadow-2xs sm:order-2"
          >
            <IconDownload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Unduh Laporan</span>
          </button>
        </div>
      </div>

      {/* 3-Column Unified KPI Cards */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        {/* Mobile: 2-Col for Pendapatan & Pengeluaran | Desktop: 3-Col */}
        <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-zinc-200/80">
          
          {/* 1. Total Pendapatan */}
          <div className="p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Pendapatan</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded shrink-0">
                <IconArrowUpRight className="w-3 h-3" /> Kas Masuk
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.totalPemasukan)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 sm:mt-1 truncate">
                {pemasukanCount > 0 ? `${pemasukanCount} transaksi masuk` : 'Belum ada arus kas masuk'}
              </div>
            </div>
          </div>

          {/* 2. Total Pengeluaran */}
          <div className="p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-zinc-500 truncate">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded shrink-0">
                <IconArrowDownLeft className="w-3 h-3" /> Kas Keluar
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

          {/* 3. Laba Bersih (Desktop View - in mobile rendered as sleek bottom summary strip) */}
          <div className="hidden md:flex p-5 flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Laba Bersih</span>
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                summary.saldo >= 0 ? 'text-emerald-600 bg-emerald-50/80' : 'text-rose-500 bg-rose-50/80'
              }`}>
                {summary.saldo >= 0 ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownLeft className="w-3 h-3" />}
                {summary.saldo >= 0 ? 'Surplus' : 'Defisit'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.saldo)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {summary.totalPemasukan > 0 
                  ? `${((summary.saldo / summary.totalPemasukan) * 100).toFixed(1)}% margin laba bersih` 
                  : 'Pendapatan dikurangi pengeluaran'}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Summary Strip: Laba Bersih & Status Margin */}
        <div className="md:hidden px-3.5 py-2.5 bg-zinc-50/80 border-t border-zinc-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-zinc-500">Laba Bersih:</span>
            <span className={`text-xs font-bold ${summary.saldo >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {formatRupiah(summary.saldo)}
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            summary.saldo >= 0 ? 'text-emerald-700 bg-emerald-100/80' : 'text-rose-600 bg-rose-100/80'
          }`}>
            {summary.saldo >= 0 ? <IconArrowUpRight className="w-3 h-3" /> : <IconArrowDownLeft className="w-3 h-3" />}
            {summary.saldo >= 0 ? 'Surplus' : 'Defisit'} ({summary.totalPemasukan > 0 ? `${((summary.saldo / summary.totalPemasukan) * 100).toFixed(1)}%` : '0%'})
          </span>
        </div>
      </div>

      {/* Main Grid: Grafik Laba Rugi (Left) & Distribusi Kategori (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Bar Chart */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Grafik Laba Rugi</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Perbandingan arus pendapatan vs pengeluaran dari transaksi nyata</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
              {/* Toggle Bulanan / Per Tanggal */}
              <div className="bg-[#f4f4f5] p-0.5 rounded-xl flex items-center text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setChartView('bulanan')}
                  className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all whitespace-nowrap text-xs leading-none ${
                    chartView === 'bulanan'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('harian')}
                  className={`px-3 py-1.5 sm:py-1 rounded-lg transition-all whitespace-nowrap text-xs leading-none ${
                    chartView === 'harian'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Per Tanggal
                </button>
              </div>

              {/* Legend (Visible on mobile too) */}
              <div className="flex items-center gap-3 text-[11px] sm:text-xs font-medium">
                <div className="flex items-center gap-1.5 text-zinc-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                  <span>Pendapatan</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]"></span>
                  <span>Pengeluaran</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-[200px] sm:h-[250px] w-full flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <IconRefresh className="w-5 h-5 animate-spin text-blue-600" />
              <span>Memuat data grafik...</span>
            </div>
          ) : chartData.length > 0 ? (
            <div className="h-[200px] sm:h-[250px] w-full -ml-3 sm:ml-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10 }} 
                    dy={8} 
                  />
                  <YAxis 
                    width={55}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10 }} 
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')}Jt`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}Rb`;
                      return `${val}`;
                    }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={<CustomBarTooltip />}
                  />
                  <Bar dataKey="Pendapatan" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Pengeluaran" fill="#e11d48" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] sm:h-[220px] w-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-2.5">
                <IconChartBar className="w-5 h-5" />
              </div>
              <p className="font-semibold text-zinc-800 text-xs sm:text-sm mb-1">Grafik Belum Ada Data</p>
              <p className="text-[11px] text-zinc-400 mb-4 max-w-xs">
                Grafik laba rugi akan otomatis terbentuk setelah Anda mencatat transaksi keuangan di database.
              </p>
              <Link
                href="/dashboard/keuangan/tambah"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <IconPlus className="w-3.5 h-3.5" /> Catat Transaksi Baru
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-100 mt-4 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Sinkron dari database PostgreSQL</span>
            <Link href="/dashboard/keuangan" className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Buka Pembukuan Lengkap</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Distribusi Kategori Transaksi */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Distribusi Kategori</h2>

              {/* Filter Kategori */}
              <div className="bg-[#f4f4f5] p-0.5 rounded-lg flex items-center text-[10px] font-medium">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('semua')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    categoryFilter === 'semua'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('masuk')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    categoryFilter === 'masuk'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('keluar')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    categoryFilter === 'keluar'
                      ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Keluar
                </button>
              </div>
            </div>
            
            {categoryBreakdown.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-zinc-700 truncate w-24 sm:w-28 shrink-0" title={cat.name}>
                      {cat.name}
                    </span>
                    <div className="flex-1 mx-2 sm:mx-3 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#2563eb] rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(cat.percentage, 4)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="font-semibold text-zinc-900 whitespace-nowrap text-right min-w-[50px] sm:min-w-[68px] text-[11px] sm:text-xs">
                        {cat.amount >= 1000000 
                          ? `Rp ${(cat.amount / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}Jt` 
                          : `Rp ${(cat.amount / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}Rb`}
                      </span>
                      <span className="text-zinc-400 text-right w-7 sm:w-8 text-[10px] sm:text-xs">{cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400 text-xs">
                Belum ada data kategori tercatat.
              </div>
            )}
          </div>

          <div className="pt-3.5 sm:pt-4 border-t border-zinc-100 mt-4 sm:mt-5 flex items-center justify-between text-[11px] text-zinc-400">
            <span>{categoryBreakdown.length} Kategori Aktif</span>
            <Link href="/dashboard/keuangan" className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
              <span>Lihat Rincian</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* TABEL RINCIAN LAPORAN TRANSAKSI KEUANGAN ASLI DARI DB   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900">Rincian Transaksi Laporan</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Daftar seluruh transaksi yang menjadi dasar perhitungan laporan keuangan Anda
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs w-full sm:w-auto">
            {/* Filter Jenis: Semua | Kas Masuk | Kas Keluar */}
            <div className="bg-[#f4f4f5] p-0.5 rounded-xl flex items-center w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTableFilterType('semua')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-lg font-medium transition-all text-center ${
                  tableFilterType === 'semua'
                    ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setTableFilterType('masuk')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-lg font-medium transition-all text-center ${
                  tableFilterType === 'masuk'
                    ? 'bg-white text-emerald-600 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Masuk ({pemasukanCount})
              </button>
              <button
                type="button"
                onClick={() => setTableFilterType('keluar')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-1 rounded-lg font-medium transition-all text-center ${
                  tableFilterType === 'keluar'
                    ? 'bg-white text-rose-500 font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Keluar ({pengeluaranCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 w-full sm:w-48"
              />
              <IconSearch className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Mobile Card List View (< sm) */}
        <div className="sm:hidden divide-y divide-zinc-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              {searchQuery ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi tercatat di database.'}
            </div>
          ) : (
            filteredTransactions.map((trx, index) => (
              <div key={trx.id || index} className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/60 transition-colors">
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
                    {trx.tipe === 'masuk' ? 'Kas Masuk' : 'Kas Keluar'}
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
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-zinc-400">
                    {searchQuery ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi tercatat di database.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx, index) => (
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
                            TRX-{String(index + 1).padStart(4, '0')}
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

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Tercatat
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right">
                      <Link 
                        href="/dashboard/keuangan"
                        className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors inline-block"
                        title="Lihat Detail Pembukuan"
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

      {/* ======================================================== */}
      {/* MODAL PILIH FORMAT UNDUH (PDF, EXCEL SPREADSHEET, CSV)   */}
      {/* ======================================================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 transform transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-zinc-100 text-zinc-800 rounded-lg">
                  <IconDownload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 leading-tight">Unduh Laporan Keuangan</h3>
                  <p className="text-[11px] text-zinc-400">Pilih format berkas yang Anda butuhkan</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 my-2">
              
              {/* Opsi 1: PDF */}
              <button
                type="button"
                onClick={() => {
                  setIsExportModalOpen(false);
                  setIsPdfSignModalOpen(true);
                }}
                className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all text-left group"
              >
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                  <IconFileTypePdf className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 text-xs">Dokumen PDF (.pdf)</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">Formal</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Laporan formal siap cetak lengkap dengan kop Bizkit, kartu ringkasan KPI, dan tabel rapi.
                  </p>
                </div>
              </button>

              {/* Opsi 2: Excel */}
              <button
                type="button"
                onClick={() => {
                  exportToExcel(transactions, summary);
                  setIsExportModalOpen(false);
                }}
                className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all text-left group"
              >
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <IconFileTypeXls className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 text-xs">Spreadsheet Excel (.xlsx)</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">Populer</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Format spreadsheet terstruktur dengan lebar kolom pas dan data angka untuk akuntansi.
                  </p>
                </div>
              </button>

              {/* Opsi 3: CSV */}
              <button
                type="button"
                onClick={() => {
                  exportToCSV(transactions, summary);
                  setIsExportModalOpen(false);
                }}
                className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition-all text-left group"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <IconFileTypeCsv className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 text-xs">Berkas CSV (.csv)</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Universal</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Format berstandar UTF-8 universal kompatibel dengan Google Sheets atau aplikasi lainnya.
                  </p>
                </div>
              </button>

            </div>

            <div className="pt-2 mt-2 border-t border-zinc-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Tanda Tangan PDF (Staff & Owner) */}
      <PdfSignatureModal
        isOpen={isPdfSignModalOpen}
        onClose={() => setIsPdfSignModalOpen(false)}
        businessName={businessName}
        defaultStaffName={currentUser?.name || 'Staff Administrasi'}
        defaultOwnerName={businessName}
        onConfirm={(staffName, ownerName) => {
          exportToPDF(transactions, {
            ...summary,
            businessName,
            staffName,
            ownerName,
            periode: 'November 2026'
          });
          setIsPdfSignModalOpen(false);
        }}
      />

    </div>
  );
}
