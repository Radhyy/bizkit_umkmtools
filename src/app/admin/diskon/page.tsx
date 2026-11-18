'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  IconTag,
  IconPlus,
  IconCheck,
  IconX,
  IconSearch,
  IconRefresh,
  IconAlertCircle,
  IconTrash,
  IconEdit,
  IconCopy,
  IconPercentage,
  IconCash,
  IconCalendar,
  IconTicket,
  IconUsers,
  IconClock
} from '@tabler/icons-react';

interface CouponItem {
  id: string;
  code: string;
  name: string;
  discountType: 'percent' | 'fixed';
  discountValue: number | string;
  minPurchase: number | string;
  maxDiscount: number | string | null;
  usageLimit: number | null;
  usageCount: number;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalCoupons: number;
  activeCoupons: number;
  totalUsageCount: number;
  totalDiscountGiven: number;
}

export default function AdminDiskonPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCoupons: 0,
    activeCoupons: 0,
    totalUsageCount: 0,
    totalDiscountGiven: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form States
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formMinPurchase, setFormMinPurchase] = useState('');
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch data kupon
  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (!res.ok) throw new Error('Gagal memuat data kode diskon.');
      const data = await res.json();
      setCoupons(data.coupons || []);
      setStats(data.stats || {
        totalCoupons: 0,
        activeCoupons: 0,
        totalUsageCount: 0,
        totalDiscountGiven: 0
      });
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal memuat kode diskon.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Filter list
  const filteredCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter((item) => {
      const isExpired = item.validUntil ? new Date(item.validUntil) < now : false;
      const isLimitReached = item.usageLimit ? item.usageCount >= item.usageLimit : false;

      if (statusFilter === 'active') {
        if (!item.isActive || isExpired || isLimitReached) return false;
      } else if (statusFilter === 'inactive') {
        if (item.isActive) return false;
      } else if (statusFilter === 'expired') {
        if (!isExpired && !isLimitReached) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
      );
    });
  }, [coupons, statusFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormName('');
    setFormDiscountType('percent');
    setFormDiscountValue('20');
    setFormMinPurchase('');
    setFormMaxDiscount('');
    setFormUsageLimit('');
    setFormValidUntil('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormName(coupon.name);
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(String(coupon.discountValue));
    setFormMinPurchase(coupon.minPurchase ? String(coupon.minPurchase) : '');
    setFormMaxDiscount(coupon.maxDiscount ? String(coupon.maxDiscount) : '');
    setFormUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '');
    setFormValidUntil(coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '');
    setFormIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  // Save / Submit Coupon (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      showToast('error', 'Kode kupon wajib diisi.');
      return;
    }
    if (!formName.trim()) {
      showToast('error', 'Nama promo wajib diisi.');
      return;
    }
    const val = Number(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      showToast('error', 'Nilai diskon harus berupa angka lebih besar dari 0.');
      return;
    }
    if (formDiscountType === 'percent' && val > 100) {
      showToast('error', 'Diskon persen tidak boleh lebih dari 100%.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        discountType: formDiscountType,
        discountValue: val,
        minPurchase: formMinPurchase ? Number(formMinPurchase) : 0,
        maxDiscount: formMaxDiscount ? Number(formMaxDiscount) : null,
        usageLimit: formUsageLimit ? parseInt(formUsageLimit, 10) : null,
        validUntil: formValidUntil ? new Date(formValidUntil).toISOString() : null,
        isActive: formIsActive
      };

      if (editingCoupon) {
        payload.id = editingCoupon.id;
        const res = await fetch('/api/admin/coupons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui kupon.');
        showToast('success', data.message || 'Kupon berhasil diperbarui.');
      } else {
        const res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal membuat kode diskon.');
        showToast('success', data.message || 'Kode diskon berhasil dibuat.');
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Aktif / Nonaktif
  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coupon.id,
          action: 'toggle_active'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status kupon.');
      showToast('success', data.message);
      fetchCoupons();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status.');
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kupon.');
      showToast('success', data.message);
      setDeleteConfirmId(null);
      fetchCoupons();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus kupon.');
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', `Kode ${code} disalin ke clipboard!`);
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
            Kelola Kode Diskon
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Buat kupon promo, atur kuota penggunaan, dan pantau efektivitas diskon platform secara realtime.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button 
            onClick={fetchCoupons}
            title="Sinkronkan data"
            disabled={isLoading}
            className="p-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : 'text-zinc-500'}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-xs transition-all text-xs cursor-pointer"
          >
            <IconPlus className="w-3.5 h-3.5" stroke={2.5} />
            <span>Buat Kode Diskon</span>
          </button>
        </div>
      </div>

      {/* Unified 4-Metric Strip */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80">
          
          {/* Total Kupon */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Kupon</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded">
                <IconTicket className="w-3 h-3" /> Semua
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.totalCoupons}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Kode diskon tersimpan</div>
            </div>
          </div>

          {/* Kupon Aktif */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Kupon Aktif</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                <IconCheck className="w-3 h-3" /> Siap Pakai
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.activeCoupons}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">Dapat digunakan checkout</div>
            </div>
          </div>

          {/* Total Penggunaan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Penggunaan</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded">
                <IconUsers className="w-3 h-3" /> Transaksi
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{stats.totalUsageCount}</div>
              <div className="text-[11px] text-amber-600 font-medium mt-1">Kali kupon diaplikasikan</div>
            </div>
          </div>

          {/* Total Potongan Diberikan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-500">Total Potongan Diskon</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-purple-600 bg-purple-50/80 px-1.5 py-0.5 rounded">
                <IconCash className="w-3 h-3" /> Hemat
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                Rp {stats.totalDiscountGiven.toLocaleString('id-ID')}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Total potongan diberikan</div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Table Card */}
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
              Semua ({stats.totalCoupons})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'active' ? 'bg-white text-emerald-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Aktif ({stats.activeCoupons})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'inactive' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Nonaktif ({coupons.filter(c => !c.isActive).length})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'expired' ? 'bg-white text-rose-600 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Kadaluarsa / Habis
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <IconSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Cari kode atau nama promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f5] border border-transparent rounded-xl focus:outline-none focus:border-zinc-300 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Coupon Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-400 font-medium border-b border-zinc-100 bg-zinc-50/60">
              <tr>
                <th className="px-5 py-3 font-normal">Kode & Nama Promo</th>
                <th className="px-4 py-3 font-normal">Nilai Diskon</th>
                <th className="px-4 py-3 font-normal">Kuota & Penggunaan</th>
                <th className="px-4 py-3 font-normal">Masa Berlaku</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-zinc-400">
                    <IconRefresh className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat daftar kode diskon...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-zinc-400">
                    <IconTag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-700">Belum ada kode diskon yang cocok.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Klik tombol &ldquo;Buat Kode Diskon&rdquo; di atas untuk membuat kode promo baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const now = new Date();
                  const isExpired = coupon.validUntil ? new Date(coupon.validUntil) < now : false;
                  const isLimitReached = coupon.usageLimit ? coupon.usageCount >= coupon.usageLimit : false;
                  const isCurrentlyActive = coupon.isActive && !isExpired && !isLimitReached;

                  return (
                    <tr key={coupon.id} className="hover:bg-zinc-50/70 transition-colors">
                      
                      {/* Kode & Nama Promo */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-100">
                            <IconTag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyCode(coupon.code)}
                                className="font-mono text-zinc-900 font-bold hover:text-blue-600 flex items-center gap-1 group text-xs tracking-wider"
                                title="Klik untuk salin kode"
                              >
                                <span>{coupon.code}</span>
                                <IconCopy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity" />
                              </button>
                              {coupon.discountType === 'percent' ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  % Persen
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Rp Nominal
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium mt-0.5 truncate max-w-xs">
                              {coupon.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Nilai Diskon */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-bold text-zinc-900 text-sm">
                            {coupon.discountType === 'percent' 
                              ? `${coupon.discountValue}%` 
                              : `Rp ${Number(coupon.discountValue).toLocaleString('id-ID')}`}
                          </p>
                          {coupon.maxDiscount && coupon.discountType === 'percent' && (
                            <p className="text-[10px] text-zinc-400">
                              Maks. Rp {Number(coupon.maxDiscount).toLocaleString('id-ID')}
                            </p>
                          )}
                          {Number(coupon.minPurchase) > 0 && (
                            <p className="text-[10px] text-zinc-400">
                              Min. Rp {Number(coupon.minPurchase).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Kuota & Penggunaan */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-900">{coupon.usageCount}</span>
                            <span className="text-zinc-400 text-[11px]">
                              / {coupon.usageLimit ? `${coupon.usageLimit} kuota` : '∞ Tanpa Batas'}
                            </span>
                          </div>
                          {coupon.usageLimit && (
                            <div className="w-24 h-1.5 bg-zinc-100 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isLimitReached ? 'bg-rose-500' : 'bg-blue-600'}`}
                                style={{ width: `${Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100))}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Masa Berlaku */}
                      <td className="px-4 py-3.5">
                        {coupon.validUntil ? (
                          <div className="flex items-center gap-1.5">
                            <IconCalendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span className={`text-[11px] font-medium ${isExpired ? 'text-rose-600 line-through' : 'text-zinc-700'}`}>
                              {new Date(coupon.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Selamanya
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isCurrentlyActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Kadaluarsa
                          </span>
                        ) : isLimitReached ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Kuota Habis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-600">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Aksi Super Admin */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Button */}
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            title={coupon.isActive ? 'Nonaktifkan kupon' : 'Aktifkan kupon'}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-colors ${
                              coupon.isActive 
                                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {coupon.isActive ? 'Matikan' : 'Aktifkan'}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            title="Edit kupon"
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmId(coupon.id)}
                            title="Hapus kupon"
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

      {/* Modal Buat / Edit Kode Diskon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-100 animate-zoom-in">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <IconTag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">
                    {editingCoupon ? 'Edit Kode Diskon' : 'Buat Kode Diskon Baru'}
                  </h3>
                  <p className="text-xs text-zinc-400">Atur parameter promo dan batasan kupon</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Kode Promo */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Kode Kupon Promo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="Misal: PROMOHEMAT20"
                  disabled={!!editingCoupon}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-60"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Huruf kapital dan angka tanpa spasi (otomatis kapital).
                </span>
              </div>

              {/* Nama Promo */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">
                  Nama / Keterangan Promo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Diskon Spesial Awal Tahun 2026"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Tipe Diskon & Nilai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Tipe Diskon</label>
                  <select
                    value={formDiscountType}
                    onChange={(e: any) => setFormDiscountType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Nilai Diskon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'percent' ? '20' : '15000'}
                    required
                    min={1}
                    max={formDiscountType === 'percent' ? 100 : undefined}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Kuota & Minimal Pembelian */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Kuota Pemakaian</label>
                  <input
                    type="number"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="Contoh: 100 (opsional)"
                    min={1}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Kosong = tanpa batas</span>
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="Opsional jika %"
                    min={0}
                    disabled={formDiscountType === 'fixed'}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Batas maksimal nominal</span>
                </div>
              </div>

              {/* Tanggal Kadaluarsa */}
              <div>
                <label className="block text-zinc-700 font-semibold mb-1">Berlaku Sampai Tanggal</label>
                <input
                  type="date"
                  value={formValidUntil}
                  onChange={(e) => setFormValidUntil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50/50 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Kosongkan jika kupon berlaku selamanya.</span>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-zinc-700 font-semibold cursor-pointer">
                  Aktifkan kode diskon ini sekarang
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingCoupon ? 'Simpan Perubahan' : 'Buat Kode Diskon'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl border border-zinc-100 animate-zoom-in">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconTrash className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-900 text-base mb-1">Hapus Kode Diskon?</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Kode kupon ini akan dihapus dari sistem dan tidak dapat lagi digunakan oleh pengguna saat checkout.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteCoupon(deleteConfirmId)}
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

