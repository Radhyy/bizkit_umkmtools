'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypeCsv,
  IconCheck,
  IconHistory,
  IconReceipt2,
  IconArrowUpRight,
  IconArrowDownRight,
  IconCalendarEvent,
  IconX,
  IconClock,
  IconDatabase
} from '@tabler/icons-react';
import { exportToPDF, exportToExcel, exportToCSV, ExportTransaction, ExportSummary } from '@/lib/exportUtils';
import PdfSignatureModal from '@/components/PdfSignatureModal';

interface HistoryItem {
  id: string;
  fileName: string;
  format: 'excel' | 'pdf' | 'csv';
  dataType: 'semua' | 'masuk' | 'keluar';
  dateRange: string;
  recordCount: number;
  totalAmount: number;
  fileSize: string;
  createdAt: string;
}

export default function ExportDataPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email: string } | null>(null);
  const [businessName, setBusinessName] = useState<string>('Usaha Anda');
  const [isPdfSignModalOpen, setIsPdfSignModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // 1. Jenis Data: 'semua' (keduanya) | 'masuk' | 'keluar'
  const [dataType, setDataType] = useState<'semua' | 'masuk' | 'keluar'>('semua');

  // 2. Rentang Waktu: 'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'semua' | 'kustom'
  const [dateRange, setDateRange] = useState<'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'semua' | 'kustom'>('bulan_ini');
  
  // Custom date picker states
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState<string>(firstDayOfMonthStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // 3. Format File: 'excel' | 'pdf' | 'csv'
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');

  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Waktu & nama bulan real-time
  const now = new Date();
  const currentMonthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthName = prevMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const currentYear = now.getFullYear();

  // Load User, Transaksi, Profil Bisnis & Riwayat Export
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

      // Ambil transaksi keuangan riil
      fetch(`/api/keuangan?userId=${u.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.transactions) {
            setTransactions(data.transactions);
          }
        })
        .catch((err) => console.error('Error fetching transactions:', err));

      // Ambil profil bisnis untuk nama usaha resmi di header dokumen
      fetch(`/api/onboarding?userId=${u.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.profile?.namaUsaha) {
            setBusinessName(data.profile.namaUsaha);
          } else if (u.name) {
            setBusinessName(u.name);
          }
        })
        .catch(() => {
          if (u.name) setBusinessName(u.name);
        });

      // Ambil 3 riwayat export terakhir
      loadHistory(u.id);

    } catch {
      router.push('/login');
    }
  }, [router]);

  const loadHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/export/history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setHistoryList(data.history.slice(0, 3));
        }
      }
    } catch (e) {
      console.error('Error loading export history:', e);
    }
  };

  // Filter Data Transaksi sesuai pilihan jenis data & rentang waktu
  const filteredData = useMemo(() => {
    return transactions.filter((trx) => {
      // 1. Filter Tipe Data
      if (dataType === 'masuk' && trx.tipe !== 'masuk') return false;
      if (dataType === 'keluar' && trx.tipe !== 'keluar') return false;

      // 2. Filter Tanggal
      if (dateRange === 'semua') return true;

      const trxDate = new Date(trx.tanggal || trx.createdAt);
      if (isNaN(trxDate.getTime())) return true;

      if (dateRange === 'bulan_ini') {
        return (
          trxDate.getFullYear() === now.getFullYear() &&
          trxDate.getMonth() === now.getMonth()
        );
      }

      if (dateRange === 'bulan_lalu') {
        const prevMonth = (now.getMonth() + 11) % 12;
        const prevYear = prevMonth === 11 ? now.getFullYear() - 1 : now.getFullYear();
        return (
          trxDate.getFullYear() === prevYear &&
          trxDate.getMonth() === prevMonth
        );
      }

      if (dateRange === 'tahun_ini') {
        return trxDate.getFullYear() === currentYear;
      }

      if (dateRange === 'kustom') {
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date('1970-01-01');
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date('2099-12-31');
        return trxDate >= start && trxDate <= end;
      }

      return true;
    });
  }, [transactions, dataType, dateRange, customStartDate, customEndDate, now, currentYear]);

  // Hitung Summary dari Data yang Tersaring
  const summaryCalculated = useMemo(() => {
    let masuk = 0;
    let keluar = 0;

    filteredData.forEach((t) => {
      const amt = Number(t.jumlah) || 0;
      if (t.tipe === 'masuk') masuk += amt;
      else if (t.tipe === 'keluar') keluar += amt;
    });

    const labelPeriode = 
      dateRange === 'bulan_ini' ? currentMonthName :
      dateRange === 'bulan_lalu' ? prevMonthName :
      dateRange === 'tahun_ini' ? `Tahun ${currentYear}` :
      dateRange === 'kustom' ? `${customStartDate} s/d ${customEndDate}` : 'Semua Periode';

    return {
      totalPemasukan: masuk,
      totalPengeluaran: keluar,
      saldo: masuk - keluar,
      totalTransaksi: filteredData.length,
      periode: labelPeriode,
    };
  }, [filteredData, dateRange, currentMonthName, prevMonthName, currentYear, customStartDate, customEndDate]);

  // Eksekusi Export Data
  const executeExport = async (staffName?: string, ownerName?: string) => {
    if (!currentUser?.id) return;
    setIsExporting(true);

    const typePrefix = dataType === 'masuk' ? 'Pemasukan' : dataType === 'keluar' ? 'Pengeluaran' : 'Keuangan';
    const ext = selectedFormat === 'excel' ? 'xls' : selectedFormat === 'pdf' ? 'pdf' : 'csv';
    const dateTag = new Date().toISOString().split('T')[0];
    const generatedFileName = `Laporan_${typePrefix}_Bizkit_${dateTag}.${ext}`;

    const summaryData: ExportSummary = {
      totalPemasukan: summaryCalculated.totalPemasukan,
      totalPengeluaran: summaryCalculated.totalPengeluaran,
      saldo: summaryCalculated.saldo,
      totalTransaksi: filteredData.length,
      businessName,
      periode: summaryCalculated.periode,
      dataType,
      staffName,
      ownerName
    };

    setTimeout(async () => {
      try {
        if (selectedFormat === 'excel') {
          exportToExcel(filteredData, summaryData);
        } else if (selectedFormat === 'pdf') {
          exportToPDF(filteredData, summaryData);
        } else if (selectedFormat === 'csv') {
          exportToCSV(filteredData, summaryData);
        }

        // Simpan ke database riwayat export
        const totalNominal = dataType === 'masuk' 
          ? summaryCalculated.totalPemasukan 
          : dataType === 'keluar' 
            ? summaryCalculated.totalPengeluaran 
            : summaryCalculated.saldo;

        const res = await fetch('/api/export/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            fileName: generatedFileName,
            format: selectedFormat,
            dataType,
            dateRange: summaryCalculated.periode,
            recordCount: filteredData.length,
            totalAmount: totalNominal,
            fileSize: `${Math.max(12, Math.round(filteredData.length * 1.8 + 24))} KB`,
          }),
        });

        if (res.ok) {
          loadHistory(currentUser.id);
        }

        setToastMessage(`Laporan formal ${selectedFormat.toUpperCase()} berhasil diunduh!`);
      } catch (err) {
        console.error('Export error:', err);
        setToastMessage(`Berkas ${selectedFormat.toUpperCase()} berhasil diproses.`);
      } finally {
        setIsExporting(false);
        setTimeout(() => setToastMessage(null), 3500);
      }
    }, 600);
  };

  // Handler Tombol Export
  const handleExport = () => {
    if (!currentUser?.id) return;
    if (selectedFormat === 'pdf') {
      setIsPdfSignModalOpen(true);
    } else {
      executeExport();
    }
  };

  // Re-download dari Riwayat Terakhir
  const handleReDownload = (item: HistoryItem) => {
    const summaryData: ExportSummary = {
      totalPemasukan: summaryCalculated.totalPemasukan,
      totalPengeluaran: summaryCalculated.totalPengeluaran,
      saldo: summaryCalculated.saldo,
      totalTransaksi: filteredData.length,
      businessName,
      periode: item.dateRange,
      dataType: item.dataType,
    };

    if (item.format === 'excel') {
      exportToExcel(filteredData, summaryData);
    } else if (item.format === 'pdf') {
      exportToPDF(filteredData, summaryData);
    } else if (item.format === 'csv') {
      exportToCSV(filteredData, summaryData);
    }
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
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

      {/* Header Section (Tanpa Icon di samping H1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Export Data</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Unduh pembukuan kas bisnis Anda secara formal dan rapi untuk arsip akuntansi atau pelaporan pajak.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-semibold shadow-2xs">
            <IconCalendarEvent className="w-3.5 h-3.5 text-zinc-400" />
            <span>Periode Aktif: {currentMonthName}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Config (8 Cols) + Right Summary (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Configuration (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Pilih Jenis Data (Pemasukan, Pengeluaran, atau Keduanya) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
            <div className="mb-4">
              <h2 className="text-base font-bold text-zinc-900">Pilih Jenis Data</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Tentukan data transaksi yang ingin Anda masukkan ke dalam laporan formal</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              
              {/* Opsi 1: Keduanya (Semua Transaksi) */}
              <div 
                onClick={() => setDataType('semua')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  dataType === 'semua' 
                    ? 'border-[#2563eb] bg-blue-50/20 ring-1 ring-blue-500/20' 
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${dataType === 'semua' ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      <IconReceipt2 className="w-4 h-4" />
                    </div>
                    {dataType === 'semua' && (
                      <span className="p-0.5 bg-[#2563eb] text-white rounded-full">
                        <IconCheck className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-zinc-900 text-xs mb-1">Semua Transaksi (Keduanya)</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Gabungan arus kas pemasukan dan pengeluaran secara lengkap.
                  </p>
                </div>
              </div>

              {/* Opsi 2: Pemasukan Saja */}
              <div 
                onClick={() => setDataType('masuk')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  dataType === 'masuk' 
                    ? 'border-[#2563eb] bg-blue-50/20 ring-1 ring-blue-500/20' 
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${dataType === 'masuk' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      <IconArrowUpRight className="w-4 h-4" />
                    </div>
                    {dataType === 'masuk' && (
                      <span className="p-0.5 bg-[#2563eb] text-white rounded-full">
                        <IconCheck className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-zinc-900 text-xs mb-1">Pemasukan Saja</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Catatan hasil penjualan produk, jasa, dan uang masuk ke kas.
                  </p>
                </div>
              </div>

              {/* Opsi 3: Pengeluaran Saja */}
              <div 
                onClick={() => setDataType('keluar')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  dataType === 'keluar' 
                    ? 'border-[#2563eb] bg-blue-50/20 ring-1 ring-blue-500/20' 
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${dataType === 'keluar' ? 'bg-rose-100 text-rose-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      <IconArrowDownRight className="w-4 h-4" />
                    </div>
                    {dataType === 'keluar' && (
                      <span className="p-0.5 bg-[#2563eb] text-white rounded-full">
                        <IconCheck className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-zinc-900 text-xs mb-1">Pengeluaran Saja</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Catatan belanja bahan baku, operasional, dan beban usaha.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Rentang Waktu & Format File */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Rentang Waktu */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
              <div className="mb-4">
                <h2 className="text-base font-bold text-zinc-900">Rentang Waktu</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Pilih periode pembukuan data</p>
              </div>

              <div className="space-y-2 text-xs font-medium text-zinc-700">
                <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/70 transition-colors cursor-pointer">
                  <input 
                    type="radio" 
                    name="date" 
                    value="bulan_ini" 
                    checked={dateRange === 'bulan_ini'} 
                    onChange={() => setDateRange('bulan_ini')} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                  />
                  <span>Bulan Ini ({currentMonthName})</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/70 transition-colors cursor-pointer">
                  <input 
                    type="radio" 
                    name="date" 
                    value="bulan_lalu" 
                    checked={dateRange === 'bulan_lalu'} 
                    onChange={() => setDateRange('bulan_lalu')} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                  />
                  <span>Bulan Lalu ({prevMonthName})</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/70 transition-colors cursor-pointer">
                  <input 
                    type="radio" 
                    name="date" 
                    value="tahun_ini" 
                    checked={dateRange === 'tahun_ini'} 
                    onChange={() => setDateRange('tahun_ini')} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                  />
                  <span>Tahun Ini ({currentYear})</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/70 transition-colors cursor-pointer">
                  <input 
                    type="radio" 
                    name="date" 
                    value="semua" 
                    checked={dateRange === 'semua'} 
                    onChange={() => setDateRange('semua')} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                  />
                  <span>Semua Periode Data</span>
                </label>

                <label className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/70 transition-colors cursor-pointer">
                  <input 
                    type="radio" 
                    name="date" 
                    value="kustom" 
                    checked={dateRange === 'kustom'} 
                    onChange={() => setDateRange('kustom')} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                  />
                  <span>Kustom (Pilih Rentang Tanggal)</span>
                </label>

                {/* Input Tanggal Kustom */}
                {dateRange === 'kustom' && (
                  <div className="pt-2 pb-1 px-1 grid grid-cols-2 gap-2 animate-fade-in">
                    <div>
                      <span className="block text-[10px] text-zinc-400 font-semibold mb-1">Mulai:</span>
                      <input 
                        type="date" 
                        value={customStartDate} 
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-400 font-semibold mb-1">Sampai:</span>
                      <input 
                        type="date" 
                        value={customEndDate} 
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Format File */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs">
              <div className="mb-4">
                <h2 className="text-base font-bold text-zinc-900">Format File</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Pilih tipe ekstensi berkas</p>
              </div>

              <div className="space-y-2.5 text-xs">
                
                {/* Excel */}
                <div 
                  onClick={() => setSelectedFormat('excel')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedFormat === 'excel' 
                      ? 'border-[#2563eb] bg-blue-50/20 text-blue-700 font-semibold shadow-2xs' 
                      : 'border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconFileSpreadsheet className={`w-4 h-4 ${selectedFormat === 'excel' ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <span>Microsoft Excel (.xlsx / .xls)</span>
                  </div>
                  {selectedFormat === 'excel' && <IconCheck className="w-4 h-4 text-blue-600 stroke-[2.5]" />}
                </div>

                {/* PDF */}
                <div 
                  onClick={() => setSelectedFormat('pdf')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedFormat === 'pdf' 
                      ? 'border-rose-500 bg-rose-50/30 text-rose-700 font-semibold shadow-2xs' 
                      : 'border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconFileTypePdf className={`w-4 h-4 ${selectedFormat === 'pdf' ? 'text-rose-600' : 'text-zinc-400'}`} />
                    <span>Dokumen Formal PDF (.pdf)</span>
                  </div>
                  {selectedFormat === 'pdf' && <IconCheck className="w-4 h-4 text-rose-600 stroke-[2.5]" />}
                </div>

                {/* CSV */}
                <div 
                  onClick={() => setSelectedFormat('csv')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedFormat === 'csv' 
                      ? 'border-[#2563eb] bg-blue-50/20 text-blue-700 font-semibold shadow-2xs' 
                      : 'border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconFileTypeCsv className={`w-4 h-4 ${selectedFormat === 'csv' ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <span>Data CSV (.csv)</span>
                  </div>
                  {selectedFormat === 'csv' && <IconCheck className="w-4 h-4 text-blue-600 stroke-[2.5]" />}
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Ringkasan Export & Riwayat Terakhir (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <h2 className="text-base font-bold text-zinc-900">Ringkasan Export</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Konfirmasi detail berkas sebelum diunduh</p>
              </div>

              <div className="space-y-3 text-xs mb-6">
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Jenis Data</span>
                  <span className="font-bold text-zinc-900">
                    {dataType === 'masuk' ? 'Pemasukan Saja' : dataType === 'keluar' ? 'Pengeluaran Saja' : 'Semua Transaksi'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Periode Data</span>
                  <span className="font-bold text-zinc-900 text-right truncate max-w-[180px]">
                    {summaryCalculated.periode}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Jumlah Transaksi</span>
                  <span className="font-bold text-zinc-900">
                    {filteredData.length} Catatan
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-zinc-100">
                  <span className="text-zinc-500">Format File</span>
                  <span className="font-bold text-blue-600 uppercase">
                    {selectedFormat}
                  </span>
                </div>
              </div>

              {/* Action Button: Solid 3D Press Button */}
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-all border-b-4 border-[#1e40af] active:border-b-0 active:translate-y-1 text-xs sm:text-sm cursor-pointer disabled:cursor-not-allowed mb-4"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyiapkan Berkas...</span>
                  </>
                ) : (
                  <>
                    <IconDownload className="w-4 h-4" />
                    <span>Mulai Export Data</span>
                  </>
                )}
              </button>
            </div>

            {/* Riwayat Terakhir (Hanya Menampilkan 3 Terakhir Saja) */}
            <div className="pt-4 border-t border-zinc-100 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 mb-3">
                <div className="flex items-center gap-1.5">
                  <IconHistory className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Riwayat Terakhir</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-normal">3 Terakhir</span>
              </div>

              {historyList.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-zinc-50 border border-dashed border-zinc-200 text-xs text-zinc-400">
                  <IconClock className="w-4 h-4 mx-auto mb-1 text-zinc-300" />
                  <span>Belum ada riwayat unduhan</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map((item) => (
                    <div 
                      key={item.id}
                      className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs hover:bg-zinc-100/70 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-zinc-900 truncate max-w-[190px]" title={item.fileName}>
                          {item.fileName}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                          <span className="uppercase font-semibold text-blue-600">{item.format}</span>
                          <span>•</span>
                          <span>{item.recordCount} baris</span>
                          <span>•</span>
                          <span>{item.fileSize || '38 KB'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleReDownload(item)}
                        title="Unduh ulang berkas ini"
                        className="p-1.5 text-zinc-500 hover:text-blue-600 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0"
                      >
                        <IconDownload className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Modal Tanda Tangan PDF */}
      <PdfSignatureModal
        isOpen={isPdfSignModalOpen}
        onClose={() => setIsPdfSignModalOpen(false)}
        businessName={businessName}
        defaultStaffName={currentUser?.name || 'Staff Administrasi'}
        defaultOwnerName={businessName}
        onConfirm={(staffName, ownerName) => {
          executeExport(staffName, ownerName);
          setIsPdfSignModalOpen(false);
        }}
      />

    </div>
  );
}
