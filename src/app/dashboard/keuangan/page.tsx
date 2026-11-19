'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  IconRefresh, 
  IconArrowUpRight, 
  IconArrowDownLeft,
  IconChevronDown, 
  IconFilter, 
  IconPlus,
  IconPencil,
  IconTrash,
  IconAlertTriangle,
  IconX,
  IconCheck,
  IconDownload,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeCsv,
  IconSearch,
  IconReceipt2,
  IconBrandWhatsapp,
  IconCopy,
  IconExternalLink,
} from '@tabler/icons-react';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/exportUtils';
import PdfSignatureModal from '@/components/PdfSignatureModal';

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
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export default function KeuanganPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pemasukan' | 'pengeluaran'>('ringkasan');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldo: 0,
    totalTransaksi: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email: string } | null>(null);

  // Filter kategori & Pencarian
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Hapus Kustom
  const [deletingTrx, setDeletingTrx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Edit Kustom
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    tipe: 'masuk' as 'masuk' | 'keluar',
    kategori: '',
    deskripsi: '',
    jumlah: '',
    tanggal: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast Notifikasi
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal Unduh Laporan & Tanda Tangan PDF
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPdfSignModalOpen, setIsPdfSignModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState<string>('Nescafe');

  // Modal Key WhatsApp & Bot Integration
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [userWaToken, setUserWaToken] = useState<string>('');
  const [botPhoneNumber, setBotPhoneNumber] = useState<string | null>(null);
  const [isBotConnected, setIsBotConnected] = useState<boolean>(false);
  const [hasCopiedWaKey, setHasCopiedWaKey] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Ambil user dan load data transaksi dari API
  const fetchKeuanganData = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/keuangan?userId=${userId}`);
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        showToast(data.error || 'Gagal memuat data transaksi', 'error');
      }
    } catch (err) {
      console.error('Error fetching keuangan data:', err);
      showToast('Terjadi kesalahan saat memuat data keuangan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaInfo = async (userId: string) => {
    try {
      const [statusRes, botRes] = await Promise.all([
        fetch(`/api/auth/check-status?userId=${encodeURIComponent(userId)}`),
        fetch('/api/whatsapp/bot-info')
      ]);

      const statusData = await statusRes.json();
      if (statusData?.waToken || statusData?.user?.waToken) {
        setUserWaToken(statusData.waToken || statusData.user.waToken);
      }

      const botData = await botRes.json();
      if (botData?.success) {
        setIsBotConnected(!!botData.isConnected);
        setBotPhoneNumber(botData.botPhoneNumber);
      }
    } catch (e) {
      console.error('Error loading WA info:', e);
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
      fetchKeuanganData(u.id);
      fetchWaInfo(u.id);

      // Ambil nama usaha dari profil bisnis untuk kop & ttd laporan
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

  // Handle Edit Transaksi
  const handleOpenEdit = (trx: Transaction) => {
    setEditingTrx(trx);
    const dateFormatted = trx.tanggal ? new Date(trx.tanggal).toISOString().split('T')[0] : '';
    setEditFormData({
      tipe: trx.tipe,
      kategori: trx.kategori,
      deskripsi: trx.deskripsi,
      jumlah: trx.jumlah.toLocaleString('id-ID'),
      tanggal: dateFormatted
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx || !currentUser) return;
    setIsSavingEdit(true);

    const parsedJumlah = parseInt(editFormData.jumlah.replace(/\D/g, "")) || 0;
    if (parsedJumlah <= 0) {
      showToast('Nominal transaksi harus lebih dari 0', 'error');
      setIsSavingEdit(false);
      return;
    }

    try {
      const res = await fetch(`/api/keuangan/${editingTrx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          tipe: editFormData.tipe,
          kategori: editFormData.kategori.trim(),
          deskripsi: editFormData.deskripsi.trim(),
          jumlah: parsedJumlah,
          tanggal: editFormData.tanggal
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui transaksi');
      }

      // Update state lokal
      const updatedList = transactions.map(t => t.id === editingTrx.id ? data.transaction : t);
      setTransactions(updatedList);
      recalculateSummary(updatedList);

      setEditingTrx(null);
      showToast('Catatan transaksi berhasil diperbarui!', 'success');
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      showToast(err.message || 'Gagal memperbarui transaksi', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Hapus Transaksi
  const handleConfirmDelete = async () => {
    if (!deletingTrx || !currentUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/keuangan/${deletingTrx.id}?userId=${currentUser.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus transaksi');
      }

      // Hapus dari state lokal
      const updatedList = transactions.filter(t => t.id !== deletingTrx.id);
      setTransactions(updatedList);
      recalculateSummary(updatedList);

      setDeletingTrx(null);
      showToast('Transaksi berhasil dihapus dari catatan Anda!', 'success');
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      showToast(err.message || 'Gagal menghapus transaksi', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Recalculate summary helper
  const recalculateSummary = (list: Transaction[]) => {
    let masuk = 0;
    let keluar = 0;
    list.forEach(t => {
      const j = Number(t.jumlah) || 0;
      if (t.tipe === 'masuk') masuk += j;
      else keluar += j;
    });
    setSummary({
      totalPemasukan: masuk,
      totalPengeluaran: keluar,
      saldo: masuk - keluar,
      totalTransaksi: list.length
    });
  };

  // Filter daftar transaksi berdasarkan Tab, Kategori, dan Search Query
  const filteredTransaksi = transactions.filter(trx => {
    if (activeTab === 'pemasukan' && trx.tipe !== 'masuk') return false;
    if (activeTab === 'pengeluaran' && trx.tipe !== 'keluar') return false;
    if (selectedCategory !== 'all' && trx.kategori !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesk = trx.deskripsi?.toLowerCase().includes(q);
      const matchKat = trx.kategori?.toLowerCase().includes(q);
      if (!matchDesk && !matchKat) return false;
    }
    return true;
  });

  // Kategori unik untuk dropdown filter
  const allCategories = Array.from(new Set(transactions.map(t => t.kategori)));

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <IconCheck className="w-4 h-4 text-emerald-600" />
          ) : (
            <IconAlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-zinc-400 hover:text-zinc-700">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section: Title + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Keuangan & Kas</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Pantau arus kas masuk, pengeluaran, dan pembukuan bisnis Anda secara terinci.</p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Refresh Data */}
          <button 
            onClick={() => currentUser?.id && fetchKeuanganData(currentUser.id)}
            title="Muat ulang data"
            disabled={loading}
            className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
          </button>

          {/* Tombol Key WhatsApp (Di sebelah kiri Unduh Laporan) */}
          <button 
            type="button"
            onClick={() => setIsWaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200/90 rounded-xl text-emerald-800 font-semibold hover:bg-emerald-100/90 transition-colors shadow-2xs cursor-pointer"
          >
            <IconBrandWhatsapp className="w-4 h-4 text-emerald-600" />
            <span>Key WhatsApp</span>
          </button>

          {/* Unduh Laporan */}
          <button 
            onClick={() => {
              if (transactions.length === 0) {
                showToast('Belum ada data transaksi untuk diunduh.', 'error');
                return;
              }
              setIsExportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-colors shadow-2xs"
          >
            <IconDownload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Unduh Laporan</span>
          </button>

          {/* Catat Transaksi Baru (Black pill matching active sidebar) */}
          <Link
            href="/dashboard/keuangan/tambah"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-xs transition-all"
          >
            <IconPlus className="w-3.5 h-3.5" stroke={2.5} />
            <span>Catat Transaksi</span>
          </Link>
        </div>
      </div>

      {/* 2-Column KPI Cards in One Bordered Container (Hanya Total Pemasukan & Total Pengeluaran) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80">
          
          {/* 1. Total Pemasukan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Pemasukan</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconArrowUpRight className="w-3 h-3" /> Kas Masuk
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.totalPemasukan)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Total penerimaan tercatat</div>
            </div>
          </div>

          {/* 2. Total Pengeluaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-500 bg-rose-50/80 px-1.5 py-0.5 rounded">
                <IconArrowDownLeft className="w-3 h-3" /> Kas Keluar
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                {formatRupiah(summary.totalPengeluaran)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Biaya & operasional bahan</div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Bar: Filter Tabs, Category Dropdown & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        
        {/* Segmented Switch: Ringkasan | Pemasukan | Pengeluaran */}
        <div className="bg-[#f4f4f5] p-0.5 rounded-xl flex items-center text-xs font-medium w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial ${
              activeTab === 'ringkasan' 
                ? 'bg-white text-zinc-900 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pemasukan')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial ${
              activeTab === 'pemasukan' 
                ? 'bg-white text-emerald-600 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pengeluaran')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex-1 sm:flex-initial ${
              activeTab === 'pengeluaran' 
                ? 'bg-white text-rose-500 font-semibold shadow-2xs' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        {/* Total Transaksi, Category Filter & Search Input */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Total Transaksi (Di sebelah kiri Semua Kategori dengan ukuran yang sama) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium shadow-2xs whitespace-nowrap">
            <IconReceipt2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>{filteredTransaksi.length} Transaksi</span>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="flex items-center justify-between gap-1.5 px-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 font-medium hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <IconFilter className="w-3.5 h-3.5 text-zinc-400" />
              <span>{selectedCategory === 'all' ? 'Semua Kategori' : selectedCategory}</span>
              <IconChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-0.5" />
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-zinc-200/80 rounded-xl shadow-lg z-20 py-1 text-xs">
                <button 
                  onClick={() => { setSelectedCategory('all'); setIsCategoryDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 transition-colors ${selectedCategory === 'all' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-zinc-700'}`}
                >
                  Semua Kategori
                </button>
                {allCategories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setIsCategoryDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-zinc-50 transition-colors ${selectedCategory === cat ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-zinc-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <IconSearch className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2" />
            <input 
              type="text" 
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 sm:w-56 pl-8 pr-3 py-1.5 text-xs bg-[#f4f4f5] border border-transparent rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-white transition-all text-zinc-800 placeholder-zinc-400"
            />
          </div>
        </div>

      </div>

      {/* Detail Transaksi Table (Identical Clean Style as Top Products) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/50">
              <tr>
                <th className="px-5 py-3 w-10 text-zinc-400 font-normal">#</th>
                <th className="px-4 py-3 font-normal">Keterangan Transaksi</th>
                <th className="px-4 py-3 font-normal">Kategori</th>
                <th className="px-4 py-3 font-normal">Tanggal</th>
                <th className="px-4 py-3 font-normal">Arus Kas</th>
                <th className="px-4 py-3 font-normal">
                  <span className="inline-flex items-center gap-1 text-zinc-700 font-medium cursor-pointer">
                    Nominal ▾
                  </span>
                </th>
                <th className="px-4 py-3 text-center font-normal w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IconRefresh className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Memuat catatan keuangan...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransaksi.length > 0 ? (
                filteredTransaksi.map((trx, index) => (
                  <tr key={trx.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Index */}
                    <td className="px-5 py-3.5 text-zinc-400 font-normal">{index + 1}</td>

                    {/* Deskripsi & Ikon */}
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
                            ID: {trx.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Kategori Badge */}
                    <td className="px-4 py-3.5 text-zinc-600 font-normal">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[11px] font-medium">
                        {trx.kategori}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="px-4 py-3.5 text-zinc-600 font-medium whitespace-nowrap">
                      {formatDateIndo(trx.tanggal)}
                    </td>

                    {/* Tipe Arus Kas */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
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
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`font-bold text-xs sm:text-sm ${
                        trx.tipe === 'masuk' ? 'text-emerald-600' : 'text-zinc-900'
                      }`}>
                        {trx.tipe === 'masuk' ? '+' : '-'}{formatRupiah(trx.jumlah)}
                      </span>
                    </td>

                    {/* Aksi: Edit & Hapus */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(trx)}
                          title="Edit transaksi"
                          className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <IconPencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTrx(trx)}
                          title="Hapus transaksi"
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-2.5">
                        <IconReceipt2 className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-zinc-800 text-xs sm:text-sm mb-1">Belum Ada Transaksi</p>
                      <p className="text-[11px] text-zinc-400 mb-4">
                        Data keuangan masih kosong untuk filter ini. Mulai dengan mencatat transaksi baru.
                      </p>
                      <Link
                        href="/dashboard/keuangan/tambah"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                      >
                        <IconPlus className="w-3.5 h-3.5" /> Catat Transaksi Baru
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL KONFIRMASI HAPUS KUSTOM                             */}
      {/* ======================================================== */}
      {deletingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 transform transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <IconAlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>

            <h3 className="text-base font-bold text-center text-zinc-900 mb-1">
              Hapus Catatan Transaksi?
            </h3>
            <p className="text-xs text-center text-zinc-500 mb-4 leading-relaxed">
              Catatan transaksi ini akan dihapus permanen dari pembukuan akun Anda.
            </p>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 mb-5 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Deskripsi:</span>
                <span className="font-semibold text-zinc-800 truncate max-w-[200px]">{deletingTrx.deskripsi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Kategori:</span>
                <span className="font-medium text-zinc-700">{deletingTrx.kategori}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Nominal:</span>
                <span className={`font-bold ${deletingTrx.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {deletingTrx.tipe === 'masuk' ? '+' : '-'}{formatRupiah(deletingTrx.jumlah)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Tanggal:</span>
                <span className="text-zinc-600">{formatDateIndo(deletingTrx.tanggal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingTrx(null)}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT TRANSAKSI KUSTOM                               */}
      {/* ======================================================== */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 transform transition-all max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-zinc-100 text-zinc-800 rounded-lg">
                  <IconPencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 leading-tight">Edit Transaksi</h3>
                  <p className="text-[11px] text-zinc-400">Perbarui catatan keuangan</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTrx(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-3 text-xs">
              
              {/* Toggle Pemasukan / Pengeluaran */}
              <div className="flex bg-[#f4f4f5] p-0.5 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, tipe: 'masuk' })}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    editFormData.tipe === 'masuk'
                      ? 'bg-white text-emerald-600 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, tipe: 'keluar' })}
                  className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    editFormData.tipe === 'keluar'
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Pengeluaran
                </button>
              </div>

              {/* Tanggal */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-700">Tanggal</label>
                <input
                  type="date"
                  required
                  value={editFormData.tanggal}
                  onChange={(e) => setEditFormData({ ...editFormData, tanggal: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                />
              </div>

              {/* Kategori */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-700">Kategori</label>
                <input
                  type="text"
                  required
                  value={editFormData.kategori}
                  onChange={(e) => setEditFormData({ ...editFormData, kategori: e.target.value })}
                  placeholder="Contoh: Penjualan Produk, Bahan Baku, dll"
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800"
                />
              </div>

              {/* Nominal */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-700">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-xs">Rp</span>
                  <input
                    type="text"
                    required
                    value={editFormData.jumlah}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setEditFormData({
                        ...editFormData,
                        jumlah: val ? parseInt(val).toLocaleString('id-ID') : ""
                      });
                    }}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-200 text-xs font-bold focus:outline-none focus:border-zinc-400 text-zinc-800"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-zinc-700">Keterangan / Deskripsi</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.deskripsi}
                  onChange={(e) => setEditFormData({ ...editFormData, deskripsi: e.target.value })}
                  placeholder="Keterangan singkat transaksi..."
                  className="px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-zinc-400 text-zinc-800 resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center gap-2 pt-2 mt-1 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingTrx(null)}
                  disabled={isSavingEdit}
                  className="flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2 px-3 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <p className="text-[11px] text-zinc-400">Pilih format berkas pembukuan Anda</p>
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
                    Laporan siap cetak lengkap dengan kop Bizkit, KPI, dan rincian transaksi.
                  </p>
                </div>
              </button>

              {/* Opsi 2: Excel */}
              <button
                type="button"
                onClick={() => {
                  exportToExcel(transactions, summary);
                  setIsExportModalOpen(false);
                  showToast('Spreadsheet Excel berhasil diunduh!', 'success');
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
                    Format tabel data terstruktur dengan kolom angka yang mudah diolah.
                  </p>
                </div>
              </button>

              {/* Opsi 3: CSV */}
              <button
                type="button"
                onClick={() => {
                  exportToCSV(transactions, summary);
                  setIsExportModalOpen(false);
                  showToast('Berkas CSV berhasil diunduh!', 'success');
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
                    Kompatibel dengan Google Sheets, Excel, atau software akuntansi lainnya.
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
          showToast('Laporan PDF dengan tanda tangan resmi berhasil disiapkan!', 'success');
        }}
      />

      {/* ======================================================== */}
      {/* MODAL KEY WHATSAPP & PANDUAN ASISTEN AI                   */}
      {/* ======================================================== */}
      {isWaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200/90 transform transition-all text-xs">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  <IconBrandWhatsapp className="w-6 h-6" stroke={2.2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 leading-tight">Key WhatsApp & Panduan Asisten AI</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Catat pembukuan keuangan toko langsung lewat chat WhatsApp</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsWaModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Token / Key Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 mb-4">
              <div className="text-[11px] font-semibold text-emerald-900 mb-1.5 flex items-center justify-between">
                <span>Key Otentikasi WhatsApp Anda:</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Rahasia</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 py-2 px-3.5 bg-white rounded-xl border border-emerald-200 font-mono text-sm font-bold text-emerald-800 tracking-wider shadow-2xs select-all">
                  {userWaToken || 'BIZ-...'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (userWaToken) {
                      navigator.clipboard.writeText(userWaToken);
                      setHasCopiedWaKey(true);
                      setTimeout(() => setHasCopiedWaKey(false), 2500);
                    }
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  {hasCopiedWaKey ? (
                    <>
                      <IconCheck className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <IconCopy className="w-3.5 h-3.5" />
                      <span>Salin Key</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-emerald-700/80 mt-2">
                Kirimkan Key ini saat pertama kali menghubungi nomor bot untuk menautkan akun toko Anda.
              </p>
            </div>

            {/* Step-by-Step Tutorial */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                Cara Menggunakan Asisten WhatsApp:
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <div className="font-semibold text-zinc-900">Buka Chat WhatsApp Bot</div>
                  <div className="text-[11px] text-zinc-500">Klik tombol hijau di bawah untuk langsung membuka chat WhatsApp dengan pesan Key otomatis terisi.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <div className="font-semibold text-zinc-900">Kirimkan Key & Tunggu Konfirmasi</div>
                  <div className="text-[11px] text-zinc-500">Bot AI akan membaca Key Anda dan mengonfirmasi akun toko Anda telah terhubung.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <div className="font-semibold text-zinc-900">Catat Bahasa Sehari-hari</div>
                  <div className="text-[11px] text-zinc-500">Ketik bebas: <em>"Beli bumbu dapur 45rb"</em>, <em>"Omset penjualan 200rb"</em>, atau <em>"Laporan hari ini"</em>.</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-lg bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <div className="font-semibold text-zinc-900">Konfirmasi Verifikasi Transaksi</div>
                  <div className="text-[11px] text-zinc-500">Bot akan merangkum nominal & kategori, lalu ketik <strong>YA</strong> untuk menyimpan ke pembukuan.</div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
              {botPhoneNumber ? (
                <>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                    <span>Nomor Bot Terhubung:</span>
                    <span className="font-mono font-bold text-emerald-700">+{botPhoneNumber.replace(/[^0-9]/g, '')}</span>
                  </div>
                  <a
                    href={`https://wa.me/${botPhoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Bizkit, ini Key WhatsApp saya: ${userWaToken}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <IconBrandWhatsapp className="w-4 h-4" />
                    <span>Chat Bot WhatsApp Sekarang</span>
                    <IconExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] leading-relaxed">
                    ⚠️ <strong>Bot WhatsApp Sedang Menunggu Scan Admin:</strong> Nomor bot resmi platform belum aktif. Begitu admin memindai barcode di menu <em>Admin WhatsApp</em>, tombol di sini akan otomatis terhubung ke nomor bot tersebut.
                  </div>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 bg-zinc-100 text-zinc-400 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <IconBrandWhatsapp className="w-4 h-4" />
                    <span>Menunggu Nomor Bot Terhubung</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
