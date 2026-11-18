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
  IconTag,
  IconCopy,
  IconCash,
  IconShieldCheck,
  IconEye
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

const PAYMENT_ICON_MAP: Record<string, { label: string; image?: string }> = {
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

  // Toast notification
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

  // Filter daftar pembelian
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      // Filter status
      const status = (item.status || '').toLowerCase();
      if (statusFilter === 'settlement' && !['settlement', 'capture', 'success'].includes(status)) {
        return false;
      }
      if (statusFilter === 'pending' && status !== 'pending') {
        return false;
      }
      if (statusFilter === 'failed' && !['expire', 'failed', 'cancel'].includes(status)) {
        return false;
      }

      // Filter search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.orderId.toLowerCase().includes(q) ||
        item.userEmail.toLowerCase().includes(q) ||
        (item.userName && item.userName.toLowerCase().includes(q)) ||
        (item.namaUsaha && item.namaUsaha.toLowerCase().includes(q)) ||
        item.paymentMethod.toLowerCase().includes(q) ||
        (item.couponCode && item.couponCode.toLowerCase().includes(q))
      );
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
    if (!confirm(`Konfirmasi verifikasi manual pembayaran ${item.orderId}? Akun pembeli akan langsung ditingkatkan ke Premium.`)) {
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
          <button onClick={() => setToastMessage(null)} className="ml-1 text-zinc-400 hover:text-zinc-600">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Kelola Pembelian
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau pesanan paket UMKM, status pembayaran Midtrans, dan riwayat transaksi secara realtime.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button 
            onClick={fetchPurchases}
            title="Sinkronkan data"
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50 font-medium"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
            <span>Sinkronkan</span>
          </button>
        </div>
      </div>

      {/* Unified 4-Metric Strip (Matching Pengguna style) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* Total Pendapatan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Pendapatan</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconCash className="w-3 h-3" /> Berhasil
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                {stats.settlementCount} transaksi paket premium aktif
              </div>
            </div>
          </div>

          {/* Pembelian Sukses */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Pembelian Sukses</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded">
                <IconCheck className="w-3 h-3" /> Settlement
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.settlementCount}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Pembayaran terverifikasi</div>
            </div>
          </div>

          {/* Menunggu Pembayaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Menunggu Bayar</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded">
                <IconClock className="w-3 h-3" /> Pending
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.pendingCount}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Menunggu QRIS / Transfer VA</div>
            </div>
          </div>

          {/* Total Order Masuk */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Pesanan</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-600 bg-purple-50/80 px-1.5 py-0.5 rounded">
                <IconShoppingCart className="w-3 h-3" /> Semua
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.totalOrders}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Tercatat di database</div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Table Card (Single unified card with filter tabs & search on header) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        
        {/* Table Filters & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-zinc-100">
          <div className="flex items-center gap-1 bg-[#f4f4f5] p-1 rounded-xl text-xs font-medium text-zinc-500 w-fit overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Semua ({stats.totalOrders})
            </button>
            <button
              onClick={() => setStatusFilter('settlement')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'settlement' ? 'bg-white text-emerald-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sukses ({stats.settlementCount})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-white text-amber-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Pending ({stats.pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'failed' ? 'bg-white text-rose-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Gagal ({stats.failedCount})
            </button>
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

        {/* Purchase Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/60">
              <tr>
                <th className="px-5 py-3 font-normal">Pembeli & Profil Usaha</th>
                <th className="px-4 py-3 font-normal">Order ID & Paket</th>
                <th className="px-4 py-3 font-normal">Metode Bayar</th>
                <th className="px-4 py-3 font-normal">Total Bayar</th>
                <th className="px-4 py-3 font-normal">Status Midtrans</th>
                <th className="px-4 py-3 font-normal">Waktu Order</th>
                <th className="px-5 py-3 font-normal text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-400">
                    <IconRefresh className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat riwayat transaksi pembelian...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-400">
                    <IconShoppingCart className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-700">Belum ada transaksi pembelian yang cocok.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Transaksi baru yang dibuat pengguna di checkout akan otomatis masuk ke sini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((item) => {
                  const status = (item.status || '').toLowerCase();
                  const isSuccess = ['settlement', 'capture', 'success'].includes(status);
                  const isPending = status === 'pending';

                  const paymentInfo = PAYMENT_ICON_MAP[item.paymentMethod] || { label: item.paymentMethod };
                  const initialLetter = item.userName 
                    ? item.userName.charAt(0).toUpperCase() 
                    : item.userEmail.charAt(0).toUpperCase();

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      
                      {/* Pembeli & Profil Usaha */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {initialLetter}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 leading-tight truncate">
                              {item.userName || item.userEmail.split('@')[0]}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{item.userEmail}</p>
                            {item.namaUsaha && (
                              <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                                <IconBuildingStore className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{item.namaUsaha} {item.kotaLokasi ? `(${item.kotaLokasi})` : ''}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Order ID & Paket */}
                      <td className="px-4 py-3.5">
                        <div>
                          <button
                            onClick={() => handleCopyOrderId(item.orderId)}
                            className="font-mono text-zinc-700 hover:text-blue-600 flex items-center gap-1 group text-[11px] font-semibold"
                            title="Klik untuk menyalin Order ID"
                          >
                            <span>{item.orderId}</span>
                            <IconCopy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity" />
                          </button>
                          <div className="mt-1">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              {item.plan === 'yearly' ? 'Paket 1 Tahun' : 'Paket 1 Bulan'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Metode Bayar */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {paymentInfo.image ? (
                            <div className="w-6 h-6 rounded-lg bg-white border border-zinc-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                              <Image
                                src={paymentInfo.image}
                                alt={paymentInfo.label}
                                width={20}
                                height={20}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                              <IconCreditCard className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span className="text-zinc-800 font-medium text-xs truncate max-w-[140px]">{paymentInfo.label}</span>
                        </div>
                      </td>

                      {/* Total Bayar */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-bold text-zinc-900">
                            Rp {Number(item.amount).toLocaleString('id-ID')}
                          </p>
                          {item.couponCode && (
                            <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                              <IconTag className="w-3 h-3" />
                              <span>{item.couponCode}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status Midtrans */}
                      <td className="px-4 py-3.5">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Sukses
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Gagal
                          </span>
                        )}
                      </td>

                      {/* Waktu Order */}
                      <td className="px-4 py-3.5 text-zinc-500">
                        <div>
                          <p className="text-zinc-700 font-medium">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-zinc-400 font-mono text-[10px]">
                            {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>

                      {/* Aksi Super Admin */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sync Midtrans */}
                          <button
                            onClick={() => handleSyncMidtrans(item)}
                            disabled={isSyncingId === item.id}
                            title="Sinkronkan status dari Midtrans"
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <IconRefresh className={`w-4 h-4 ${isSyncingId === item.id ? 'animate-spin text-blue-600' : ''}`} />
                          </button>

                          {/* Verifikasi Manual jika pending */}
                          {isPending && (
                            <button
                              onClick={() => handleManualVerify(item)}
                              title="Verifikasi manual & aktifkan premium"
                              className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Verifikasi
                            </button>
                          )}

                          {/* Detail */}
                          <button
                            onClick={() => {
                              setSelectedPurchase(item);
                              setIsDetailModalOpen(true);
                            }}
                            title="Lihat rincian transaksi"
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <IconEye className="w-4 h-4" />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Hapus riwayat pesanan"
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-100 animate-zoom-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IconReceipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">Rincian Pembelian</h3>
                  <p className="text-xs text-zinc-400 font-mono">{selectedPurchase.orderId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl flex justify-between items-center">
                <span className="text-zinc-500">Status Pembayaran</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  ['settlement', 'capture', 'success'].includes(selectedPurchase.status)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : selectedPurchase.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {selectedPurchase.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-zinc-100">
                  <p className="text-zinc-400 text-[10px]">Nama Pembeli</p>
                  <p className="font-bold text-zinc-900 mt-0.5">{selectedPurchase.userName || 'Tanpa Nama'}</p>
                  <p className="text-[11px] text-zinc-400">{selectedPurchase.userEmail}</p>
                </div>
                <div className="p-3 rounded-xl border border-zinc-100">
                  <p className="text-zinc-400 text-[10px]">Paket Langganan</p>
                  <p className="font-bold text-zinc-900 mt-0.5">
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
                  <p className="font-mono text-[11px] text-zinc-700 break-all">{selectedPurchase.snapToken}</p>
                </div>
              )}

              <div className="p-3 rounded-xl border border-zinc-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Metode Pembayaran:</span>
                  <span className="font-semibold text-zinc-800 uppercase">{selectedPurchase.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Waktu Order:</span>
                  <span className="text-zinc-700">{new Date(selectedPurchase.createdAt).toLocaleString('id-ID')}</span>
                </div>
                {selectedPurchase.paidAt && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Waktu Terbayar:</span>
                    <span>{new Date(selectedPurchase.paidAt).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-100">
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
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-all"
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl border border-zinc-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconTrash className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Hapus Riwayat Pesanan?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Tindakan ini hanya menghapus log riwayat transaksi pembelian ini dari dashboard admin.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
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
