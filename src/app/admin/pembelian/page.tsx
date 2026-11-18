'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  IconShoppingCart,
  IconCheck,
  IconClock,
  IconX,
  IconSearch,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
  IconBuildingStore,
  IconReceipt,
  IconCreditCard,
  IconQrcode,
  IconBuildingBank,
  IconTag,
  IconExternalLink,
  IconCopy,
  IconWallet,
  IconCash,
  IconShieldCheck
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
  status: 'pending' | 'settlement' | 'capture' | 'success' | 'expire' | 'failed' | 'cancel';
  snapToken: string | null;
  snapRedirectUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
  namaUsaha: string | null;
  kotaLokasi: string | null;
  kategoriBisnis: string | null;
}

interface Stats {
  totalRevenue: number;
  settlementCount: number;
  pendingCount: number;
  failedCount: number;
  totalOrders: number;
}

const PAYMENT_ICON_MAP: Record<string, { label: string; image?: string; fallbackIcon?: React.ReactNode }> = {
  'qris': { label: 'QRIS & E-Wallet', image: '/iconpembayaran/qris.png' },
  'bca_va': { label: 'BCA Virtual Account', image: '/iconpembayaran/bca.png' },
  'mandiri_va': { label: 'Mandiri Virtual Account', image: '/iconpembayaran/mandiri.png' },
  'bni_va': { label: 'BNI Virtual Account', image: '/iconpembayaran/bni.png' },
  'bri_va': { label: 'BRI Virtual Account', image: '/iconpembayaran/bri.png' },
  'credit_card': { label: 'Kartu Kredit / Debit' },
  'all': { label: 'Semua Metode' }
};

export default function AdminPembelianPage() {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    settlementCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalOrders: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'settlement' | 'pending' | 'failed'>('all');

  // Modal Detail & Verifikasi
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSyncingId, setIsSyncingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Ambil data pembelian dari server
  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/purchases');
      if (!res.ok) throw new Error('Gagal memuat data pembelian.');
      const data = await res.json();
      setPurchases(data.purchases || []);
      setStats(data.stats || {
        totalRevenue: 0,
        settlementCount: 0,
        pendingCount: 0,
        failedCount: 0,
        totalOrders: 0
      });
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal memuat data pembelian.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      // 1. Filter status
      const st = (item.status || '').toLowerCase();
      if (statusFilter === 'settlement' && !['settlement', 'capture', 'success'].includes(st)) return false;
      if (statusFilter === 'pending' && st !== 'pending') return false;
      if (statusFilter === 'failed' && !['expire', 'failed', 'cancel'].includes(st)) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrderId = item.orderId.toLowerCase().includes(q);
        const matchName = (item.userName || '').toLowerCase().includes(q);
        const matchEmail = item.userEmail.toLowerCase().includes(q);
        const matchBiz = (item.namaUsaha || '').toLowerCase().includes(q);
        const matchMethod = (item.paymentMethod || '').toLowerCase().includes(q);
        const matchCoupon = (item.couponCode || '').toLowerCase().includes(q);
        if (!matchOrderId && !matchName && !matchEmail && !matchBiz && !matchMethod && !matchCoupon) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, statusFilter, searchQuery]);

  // Sinkronisasi status ke Midtrans API
  const handleSyncMidtrans = async (item: PurchaseItem) => {
    setIsSyncingId(item.id);
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: item.id,
          orderId: item.orderId,
          action: 'sync_midtrans'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal sinkronisasi dengan Midtrans.');

      showToast('success', data.message || 'Status berhasil disinkronkan!');
      fetchPurchases();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal sinkronisasi dengan Midtrans.');
    } finally {
      setIsSyncingId(null);
    }
  };

  // Verifikasi manual oleh Super Admin
  const handleManualVerify = async (item: PurchaseItem) => {
    if (!confirm(`Konfirmasi verifikasi pembayaran manual untuk pesanan ${item.orderId}? Akun pembeli akan langsung ditingkatkan ke Premium.`)) {
      return;
    }

    setIsSyncingId(item.id);
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: item.id,
          action: 'manual_verify'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memverifikasi manual.');

      showToast('success', data.message || 'Pembayaran berhasil diverifikasi!');
      fetchPurchases();
      if (isDetailModalOpen) setIsDetailModalOpen(false);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memverifikasi manual.');
    } finally {
      setIsSyncingId(null);
    }
  };

  // Hapus riwayat pesanan
  const handleDeletePurchase = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/purchases?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Gagal menghapus riwayat pesanan.');

      showToast('success', 'Riwayat pesanan berhasil dihapus.');
      setDeleteConfirmId(null);
      fetchPurchases();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus pesanan.');
    }
  };

  // Salin Order ID ke clipboard
  const handleCopyOrderId = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Order ID disalin ke clipboard.');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold border transition-all animate-fade-in-up ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10' 
            : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
        }`}>
          {toastMessage.type === 'success' ? (
            <IconCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <IconAlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>Kelola Pembelian Paket</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pantau pesanan paket UMKM, status pembayaran Midtrans, dan riwayat transaksi secara realtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPurchases}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sinkronkan</span>
          </button>
        </div>
      </div>

      {/* Metric Strip (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Pendapatan */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Total Pendapatan</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Berhasil
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Dari {stats.settlementCount} transaksi paket premium aktif
          </p>
        </div>

        {/* Card 2: Pembelian Sukses */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Pembelian Sukses</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Settlement
            </span>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 tracking-tight">
            {stats.settlementCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Pembayaran telah diverifikasi otomatis
          </p>
        </div>

        {/* Card 3: Menunggu Pembayaran */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Menunggu Pembayaran</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Pending
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Menunggu scan QRIS / transfer VA
          </p>
        </div>

        {/* Card 4: Total Order Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">Total Order Masuk</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Semua Pesanan
            </span>
          </div>
          <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {stats.totalOrders}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Seluruh pesanan tercatat di database
          </p>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua ({purchases.length})
          </button>
          <button
            onClick={() => setStatusFilter('settlement')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'settlement'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sukses ({stats.settlementCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'pending'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({stats.pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'failed'
                ? 'bg-black text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Gagal ({stats.failedCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <IconSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari order ID, email, atau metode..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-5">Pembeli & Profil Usaha</th>
                <th className="py-3 px-5">Order ID & Paket</th>
                <th className="py-3 px-5">Metode Pembayaran</th>
                <th className="py-3 px-5">Total Bayar</th>
                <th className="py-3 px-5">Status Midtrans</th>
                <th className="py-3 px-5">Waktu Order</th>
                <th className="py-3 px-5 text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data riwayat pembelian...</span>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <IconShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">Belum ada transaksi pembelian yang cocok.</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Transaksi baru yang dibuat pengguna di halaman checkout akan otomatis masuk ke sini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const status = (item.status || '').toLowerCase();
                  const isSuccess = ['settlement', 'capture', 'success'].includes(status);
                  const isPending = status === 'pending';
                  const isFailed = ['expire', 'failed', 'cancel'].includes(status);

                  const paymentInfo = PAYMENT_ICON_MAP[item.paymentMethod] || { label: item.paymentMethod };

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      
                      {/* Pembeli & Profil Usaha */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {item.userName ? item.userName.charAt(0).toUpperCase() : item.userEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {item.userName || item.userEmail.split('@')[0]}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">{item.userEmail}</p>
                            {item.namaUsaha && (
                              <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                                <IconBuildingStore className="w-3 h-3" />
                                <span>{item.namaUsaha} {item.kotaLokasi ? `(${item.kotaLokasi})` : ''}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Order ID & Paket */}
                      <td className="py-3.5 px-5">
                        <div>
                          <button
                            onClick={() => handleCopyOrderId(item.orderId)}
                            className="font-mono font-semibold text-gray-800 hover:text-blue-600 flex items-center gap-1 group text-[11px]"
                            title="Klik untuk menyalin Order ID"
                          >
                            <span>{item.orderId}</span>
                            <IconCopy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              {item.plan === 'yearly' ? 'Paket 1 Tahun' : 'Paket 1 Bulan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Metode Pembayaran */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          {paymentInfo.image ? (
                            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <Image
                                src={paymentInfo.image}
                                alt={paymentInfo.label}
                                width={24}
                                height={24}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                              <IconCreditCard className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-semibold text-gray-800">{paymentInfo.label}</span>
                        </div>
                      </td>

                      {/* Total Bayar & Kupon */}
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="font-extrabold text-gray-900">
                            Rp {Number(item.amount).toLocaleString('id-ID')}
                          </p>
                          {item.couponCode && (
                            <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                              <IconTag className="w-3 h-3" />
                              <span>Kupon: {item.couponCode}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Midtrans */}
                      <td className="py-3.5 px-5">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Sukses / Terbayar
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Menunggu Bayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Gagal / Expired
                          </span>
                        )}
                      </td>

                      {/* Waktu Order */}
                      <td className="py-3.5 px-5 text-gray-500 text-[11px]">
                        <div>
                          <p>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-gray-400 font-mono text-[10px]">
                            {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>

                      {/* Aksi Super Admin */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Cek / Sinkron ke Midtrans */}
                          <button
                            onClick={() => handleSyncMidtrans(item)}
                            disabled={isSyncingId === item.id}
                            title="Sinkronkan status dari Midtrans API"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <IconRefresh className={`w-4 h-4 ${isSyncingId === item.id ? 'animate-spin text-blue-600' : ''}`} />
                          </button>

                          {/* Tombol Verifikasi Manual jika pending */}
                          {isPending && (
                            <button
                              onClick={() => handleManualVerify(item)}
                              title="Verifikasi manual & aktifkan premium"
                              className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Verifikasi
                            </button>
                          )}

                          {/* Tombol Detail Info */}
                          <button
                            onClick={() => {
                              setSelectedPurchase(item);
                              setIsDetailModalOpen(true);
                            }}
                            title="Lihat rincian transaksi"
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <IconReceipt className="w-4 h-4" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Hapus riwayat pesanan"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Pembelian */}
      {isDetailModalOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-zoom-in">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IconReceipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Rincian Pembelian</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedPurchase.orderId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                <span className="text-gray-500">Status Pembayaran</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  ['settlement', 'capture', 'success'].includes(selectedPurchase.status)
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedPurchase.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedPurchase.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-gray-100">
                  <p className="text-gray-400 text-[10px]">Nama Pembeli</p>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedPurchase.userName || 'Tanpa Nama'}</p>
                  <p className="text-[11px] text-gray-500">{selectedPurchase.userEmail}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-100">
                  <p className="text-gray-400 text-[10px]">Paket Langganan</p>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedPurchase.plan === 'yearly' ? 'Tahunan (1 Tahun)' : 'Bulanan (1 Bulan)'}
                  </p>
                  <p className="text-[11px] text-blue-600 font-semibold">
                    Rp {Number(selectedPurchase.amount).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {selectedPurchase.snapToken && (
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-700 font-bold mb-1">Snap Token Midtrans</p>
                  <p className="font-mono text-[11px] text-slate-700 break-all">{selectedPurchase.snapToken}</p>
                </div>
              )}

              <div className="p-3 rounded-xl border border-gray-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Metode Pembayaran:</span>
                  <span className="font-semibold text-gray-800 uppercase">{selectedPurchase.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Waktu Order:</span>
                  <span className="text-gray-700">{new Date(selectedPurchase.createdAt).toLocaleString('id-ID')}</span>
                </div>
                {selectedPurchase.paidAt && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Waktu Terbayar:</span>
                    <span>{new Date(selectedPurchase.paidAt).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              {selectedPurchase.status === 'pending' && (
                <button
                  onClick={() => handleManualVerify(selectedPurchase)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Verifikasi Manual
                </button>
              )}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl border border-gray-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconTrash className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Hapus Riwayat Pesanan?</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Tindakan ini hanya menghapus log riwayat transaksi pembelian ini dari dashboard admin.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeletePurchase(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

