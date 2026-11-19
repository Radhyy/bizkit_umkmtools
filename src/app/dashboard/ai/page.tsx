'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  IconRefresh, 
  IconTrendingUp,
  IconBulb,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconReceipt2,
  IconShoppingBag,
  IconSparkles,
  IconPlus
} from '@tabler/icons-react';

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

interface WawasanItem {
  tipe: 'tren' | 'biaya' | 'rasio';
  judul: string;
  deskripsi: string;
  highlight?: string;
  status: 'positif' | 'peringatan' | 'netral';
}

interface TipItem {
  judul: string;
  deskripsi: string;
  kategori: 'omzet' | 'biaya' | 'kas';
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Tooltip Hitam Modern & Presisi
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const current = payload.find((p: any) => p.dataKey === 'current')?.value || 0;
    const prev = payload.find((p: any) => p.dataKey === 'prev')?.value || 0;

    return (
      <div className="bg-[#18181b] text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex flex-col gap-1.5 whitespace-nowrap font-jakarta">
        <div className="text-zinc-400 font-medium text-[11px] pb-1 border-b border-zinc-800">
          Hari: {label}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            Minggu Ini:
          </span>
          <span className="font-bold text-white">{formatRupiah(current)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            Minggu Lalu:
          </span>
          <span className="font-bold text-zinc-300">{formatRupiah(prev)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function InsightPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wawasanList, setWawasanList] = useState<WawasanItem[]>([]);
  const [tipsList, setTipsList] = useState<TipItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tren' | 'pengeluaran' | 'tips'>('ringkasan');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Load User dari localStorage
  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!raw) {
      router.push('/login');
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (!u?.id) {
        router.push('/login');
        return;
      }
      setCurrentUser(u);
      loadAllData(u.id, false);
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Fetch data Keuangan & AI Insight
  const loadAllData = async (userId: string, forceAiRefresh: boolean = false) => {
    if (forceAiRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 1. Ambil transaksi keuangan riil dari database
      const trxRes = await fetch(`/api/keuangan?userId=${userId}`);
      if (trxRes.ok) {
        const trxData = await trxRes.json();
        setTransactions(trxData.transactions || []);
      }

      // 2. Ambil Wawasan & Tips AI dari database cache / Groq
      const insightRes = await fetch(`/api/ai/insight?userId=${userId}${forceAiRefresh ? '&force=true' : ''}`);
      if (insightRes.ok) {
        const insightData = await insightRes.json();
        if (Array.isArray(insightData.wawasan)) {
          setWawasanList(insightData.wawasan);
        }
        if (Array.isArray(insightData.tips)) {
          setTipsList(insightData.tips);
        }
        setIsFromCache(Boolean(insightData.cached));
      }

      if (forceAiRefresh) {
        setToastMessage('Insight bisnis & data keuangan berhasil disinkronkan!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Error loading insight data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (currentUser?.id) {
      loadAllData(currentUser.id, true);
    }
  };

  // Kalkulasi Tren Pemasukan Harian (Sen-Min) berdasarkan data riil
  const { chartData, rataRataPemasukan, puncakHari, totalPemasukanMingguIni, trenPersen } = useMemo(() => {
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const currentWeekValues = [0, 0, 0, 0, 0, 0, 0];
    const prevWeekValues = [0, 0, 0, 0, 0, 0, 0];

    const now = new Date();
    // Cari hari Senin minggu ini
    const currentDay = now.getDay(); // 0 is Sunday
    const distanceToMonday = (currentDay + 6) % 7;
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - distanceToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    const startOfPrevWeek = new Date(startOfCurrentWeek);
    startOfPrevWeek.setDate(startOfCurrentWeek.getDate() - 7);

    let totalCurrent = 0;
    let totalPrev = 0;

    transactions.forEach((trx) => {
      if (trx.tipe !== 'masuk') return;
      const amt = Number(trx.jumlah) || 0;
      const trxDate = new Date(trx.tanggal || trx.createdAt);
      
      const dayIndex = (trxDate.getDay() + 6) % 7; // 0 for Sen, 6 for Min

      if (trxDate >= startOfCurrentWeek) {
        currentWeekValues[dayIndex] += amt;
        totalCurrent += amt;
      } else if (trxDate >= startOfPrevWeek && trxDate < startOfCurrentWeek) {
        prevWeekValues[dayIndex] += amt;
        totalPrev += amt;
      } else {
        // Jika belum ada rentang tanggal penuh, petakan ke hari transaksi
        currentWeekValues[dayIndex] += amt;
        totalCurrent += amt;
      }
    });

    const data = dayNames.map((day, idx) => ({
      day,
      current: currentWeekValues[idx],
      prev: prevWeekValues[idx],
    }));

    // Cari hari puncak
    let maxVal = -1;
    let maxDayName = 'Sen';
    data.forEach((d) => {
      if (d.current > maxVal) {
        maxVal = d.current;
        maxDayName = d.day;
      }
    });

    const fullDayMap: Record<string, string> = {
      Sen: 'Senin',
      Sel: 'Selasa',
      Rab: 'Rabu',
      Kam: 'Kamis',
      Jum: 'Jumat',
      Sab: 'Sabtu',
      Min: 'Minggu'
    };

    const avg = Math.round(totalCurrent / 7);
    const growth = totalPrev > 0 ? Math.round(((totalCurrent - totalPrev) / totalPrev) * 100) : 0;

    return {
      chartData: data,
      rataRataPemasukan: avg,
      puncakHari: { day: fullDayMap[maxDayName] || maxDayName, val: maxVal > 0 ? maxVal : 0 },
      totalPemasukanMingguIni: totalCurrent,
      trenPersen: growth,
    };
  }, [transactions]);

  // Kalkulasi Pembelian Bahan & Biaya Terbesar dari Transaksi Pengeluaran
  const { topExpenses, totalBelanjaBahan } = useMemo(() => {
    const expenseMap: Record<string, { count: number; total: number }> = {};
    let totalAll = 0;

    transactions.forEach((trx) => {
      if (trx.tipe !== 'keluar') return;
      const amt = Number(trx.jumlah) || 0;
      totalAll += amt;

      const key = (trx.deskripsi || trx.kategori || 'Pengeluaran Operasional').trim();
      if (!expenseMap[key]) {
        expenseMap[key] = { count: 0, total: 0 };
      }
      expenseMap[key].count += 1;
      expenseMap[key].total += amt;
    });

    const list = Object.entries(expenseMap)
      .map(([name, data]) => ({
        name,
        total: data.total,
        frekuensi: `${data.count}x belanja`,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    return {
      topExpenses: list,
      totalBelanjaBahan: totalAll,
    };
  }, [transactions]);

  return (
    <div className="p-4 sm:p-8 max-w-[1280px] mx-auto space-y-4 sm:space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <IconCheck className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-zinc-700">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section (Tanpa Icon di samping Title H1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Insight Bisnis</h1>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Analisis data cerdas untuk memantau performa pemasukan, pengeluaran bahan, dan arus kas Anda.
          </p>
        </div>

        {/* Action Button: Refresh AI & Keuangan */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={handleRefresh}
            title="Sinkronkan data dan perbarui analisis AI"
            disabled={isRefreshing || isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 bg-white border border-zinc-200/90 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors shadow-2xs disabled:opacity-50"
          >
            <IconRefresh className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
            <span>{isRefreshing ? 'Menganalisis...' : 'Perbarui Insight'}</span>
          </button>
        </div>
      </div>

      {/* Segmented Switch Filter Bar */}
      <div className="bg-[#f4f4f5] p-1 rounded-xl flex items-center text-xs font-medium w-full sm:w-auto overflow-x-auto no-scrollbar gap-1">
        <button 
          onClick={() => setActiveTab('ringkasan')}
          className={`flex-1 sm:flex-initial text-center px-3.5 py-2 sm:py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'ringkasan' 
              ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Ringkasan
        </button>
        <button 
          onClick={() => setActiveTab('tren')}
          className={`flex-1 sm:flex-initial text-center px-3.5 py-2 sm:py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'tren' 
              ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Tren Pemasukan
        </button>
        <button 
          onClick={() => setActiveTab('pengeluaran')}
          className={`flex-1 sm:flex-initial text-center px-3.5 py-2 sm:py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'pengeluaran' 
              ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Pengeluaran Bahan
        </button>
        <button 
          onClick={() => setActiveTab('tips')}
          className={`flex-1 sm:flex-initial text-center px-3.5 py-2 sm:py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'tips' 
              ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Tips & Saran
        </button>
      </div>

      {/* Main Grid: Top Row (Tren Pemasukan & Pembelian Bahan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Tren Pemasukan Bar Chart (7 Cols, Tanpa Icon di H2) */}
        {(activeTab === 'ringkasan' || activeTab === 'tren') && (
          <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">Tren Pemasukan</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-snug">
                    Berdasarkan nominal hasil penjualan harian dari database
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                    trenPersen >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' : 'text-rose-700 bg-rose-50 border border-rose-200/60'
                  }`}>
                    <IconTrendingUp className="w-3.5 h-3.5" /> {trenPersen >= 0 ? `+${trenPersen}%` : `${trenPersen}%`}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5 whitespace-nowrap">vs minggu lalu</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] sm:text-xs font-medium mb-3">
                <div className="flex items-center gap-1.5 text-zinc-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                  <span>Minggu Ini</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]"></span>
                  <span>Minggu Lalu</span>
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-[210px] sm:h-[220px] w-full mt-2 -ml-3 sm:ml-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      dy={8}
                    />
                    <YAxis 
                      width={52}
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#a1a1aa', fontSize: 10 }}
                      tickFormatter={(val) => {
                        if (val === 0) return '0';
                        if (val >= 1000000) return `${(val / 1000000).toLocaleString('id-ID')}Jt`;
                        return `${(val / 1000).toLocaleString('id-ID')}Rb`;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="current" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="prev" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-500">
              <div className="flex items-center justify-between sm:justify-start gap-1">
                <span>Rata-rata pemasukan:</span>
                <span className="font-semibold text-zinc-800">{formatRupiah(rataRataPemasukan)} / hari</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-1">
                <span>Puncak tertinggi:</span>
                <span className="font-semibold text-zinc-900">
                  {puncakHari.day} ({formatRupiah(puncakHari.val)})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pembelian Bahan & Biaya Terbesar (5 Cols, Tanpa Icon di H2) */}
        {(activeTab === 'ringkasan' || activeTab === 'pengeluaran') && (
          <div className={`bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between ${
            activeTab === 'pengeluaran' ? 'lg:col-span-12' : 'lg:col-span-5'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">Pembelian Bahan & Biaya</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Pengeluaran bahan yang paling sering dibeli</p>
                </div>
              </div>

              {topExpenses.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-400 space-y-2 border border-dashed border-zinc-200 rounded-xl">
                  <IconShoppingBag className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="font-medium text-zinc-600">Belum ada data pengeluaran bahan</p>
                  <p className="text-[11px] text-zinc-400">Catat belanja bahan usaha di menu Keuangan</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topExpenses.map((item) => (
                    <div 
                      key={item.rank} 
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-50/80 transition-colors text-xs border border-zinc-100 gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-5 text-center font-bold shrink-0 ${
                          item.rank <= 3 ? 'text-zinc-900' : 'text-zinc-400'
                        }`}>
                          {item.rank}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-zinc-800 truncate text-xs">{item.name}</div>
                          <div className="text-[10px] text-zinc-400">{item.frekuensi}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 tabular-nums shrink-0">
                        <span className="px-2.5 py-1 bg-zinc-50 text-zinc-900 font-bold rounded-lg text-xs border border-zinc-200/60 whitespace-nowrap">
                          {formatRupiah(item.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-500">
              <div className="flex items-center justify-between sm:justify-start gap-1">
                <span>Total belanja bahan:</span>
                <span className="font-bold text-zinc-900">{formatRupiah(totalBelanjaBahan)}</span>
              </div>
              <span className="text-zinc-400 self-end sm:self-auto text-[10px] sm:text-[11px]">
                {topExpenses.length} Item Terbesar
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Grid: Wawasan Penting & Saran / Tips Finansial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Wawasan Penting (7 Cols, Tanpa Icon di H2, Teks Vertikal Tengah / items-center) */}
        {(activeTab === 'ringkasan' || activeTab === 'tren') && (
          <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">Wawasan Penting</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Analisis cerdas pola pemasukan dan fluktuasi harga bahan dari catatan Anda</p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-zinc-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {wawasanList.map((w, idx) => {
                  const isPositif = w.status === 'positif';
                  const isPeringatan = w.status === 'peringatan';

                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60"
                    >
                      <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 mt-0.5 shadow-2xs ${
                        isPositif 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : isPeringatan 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {w.tipe === 'tren' ? (
                          <IconTrendingUp className="w-4 h-4" />
                        ) : w.tipe === 'biaya' ? (
                          <IconShoppingBag className="w-4 h-4" />
                        ) : (
                          <IconReceipt2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed min-w-0">
                        <span className="font-bold text-zinc-900 block mb-0.5 text-xs sm:text-sm">{w.judul}</span>
                        <p className="text-zinc-600 text-xs sm:text-sm leading-normal">{w.deskripsi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Saran & Tips Finansial (5 Cols, Tanpa Icon di H2, Tanpa Button Terapkan) */}
        {(activeTab === 'ringkasan' || activeTab === 'tips') && (
          <div className={`bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between ${
            activeTab === 'tips' ? 'lg:col-span-12' : 'lg:col-span-5'
          }`}>
            <div>
              <div className="mb-3 sm:mb-4">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">Saran & Tips Bisnis</h2>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Panduan praktis menjaga omzet dan mengantisipasi penurunan kas</p>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-zinc-100 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {tipsList.map((tip, idx) => {
                    const isOmzet = tip.kategori === 'omzet';
                    const isBiaya = tip.kategori === 'biaya';

                    return (
                      <div key={idx} className="p-3 sm:p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          isOmzet 
                            ? 'bg-blue-100 text-blue-700' 
                            : isBiaya 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOmzet ? (
                            <IconBulb className="w-3.5 h-3.5" />
                          ) : isBiaya ? (
                            <IconAlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <IconReceipt2 className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="text-xs text-zinc-600 leading-relaxed min-w-0">
                          <span className="font-bold text-zinc-900 block mb-0.5 text-xs">{tip.judul}</span>
                          <p className="text-zinc-600 text-xs leading-normal">{tip.deskripsi}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 mt-3 text-[11px] text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>Saran otomatis diperbarui dari pembukuan harian</span>
              <span className="flex items-center gap-1 text-zinc-500 font-medium self-end sm:self-auto">
                <IconSparkles className="w-3.5 h-3.5 text-blue-500" /> AI Konsultan
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
