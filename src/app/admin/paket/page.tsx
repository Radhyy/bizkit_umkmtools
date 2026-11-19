'use client';

import React, { useState, useEffect } from 'react';
import {
  IconSparkles,
  IconCurrencyDollar,
  IconUsers,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconEdit,
  IconBolt,
  IconDatabase,
  IconCrown,
  IconArrowUpRight,
  IconTrendingUp,
  IconInfoCircle,
  IconX,
  IconDeviceFloppy,
  IconCalendarTime,
  IconCreditCard,
  IconShieldCheck
} from '@tabler/icons-react';

interface PlanItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  billingCycle: 'lifetime' | 'monthly' | 'annual';
  badge: string;
  features: string[];
  isActive: boolean;
  updatedAt: string;
}

interface StatsData {
  activeSubscribers: number;
  totalUsers: number;
  conversionRate: number;
  monthlySubsCount: number;
  yearlySubsCount: number;
  mrr: number;
  arr: number;
  totalRevenue: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

interface CacheMetrics {
  isCached: boolean;
  lastFetchedAt: string | null;
  cacheAgeSeconds: number;
  ttlRemainingSeconds: number;
  hits: number;
  misses: number;
  cachedPlansCount: number;
}

export default function AdminPaketPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    activeSubscribers: 0,
    totalUsers: 0,
    conversionRate: 0,
    monthlySubsCount: 0,
    yearlySubsCount: 0,
    mrr: 0,
    arr: 0,
    totalRevenue: 0,
    monthlyPrice: 49000,
    yearlyPrice: 468000
  });
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newOriginalPrice, setNewOriginalPrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch data paket & MRR
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch('/api/admin/plans', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlans(data.plans || []);
        if (data.stats) setStats(data.stats);
        if (data.cacheMetrics) setCacheMetrics(data.cacheMetrics);
      } else {
        showToast('error', data.error || 'Gagal mengambil data paket.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Flush / refresh cache memory
  const handleFlushCache = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flush' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Otak cache berhasil diperbarui langsung dari database!');
        if (data.plans) setPlans(data.plans);
        if (data.cacheMetrics) setCacheMetrics(data.cacheMetrics);
      } else {
        showToast('error', data.error || 'Gagal me-refresh cache.');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Gagal me-refresh cache.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open edit modal
  const openEditModal = (plan: PlanItem) => {
    setEditingPlan(plan);
    setNewPrice(plan.price);
    setNewOriginalPrice(plan.originalPrice || plan.price);
  };

  // Close modal
  const closeEditModal = () => {
    setEditingPlan(null);
    setIsSaving(false);
  };

  // Submit edit harga
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (newPrice < 0 || isNaN(newPrice)) {
      showToast('error', 'Nominal harga tidak boleh negatif.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlan.id,
          price: Number(newPrice),
          originalPrice: Number(newOriginalPrice)
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast('success', data.message || 'Harga paket berhasil diperbarui & disimpan ke otak cache!');
        closeEditModal();
        // Update local state immediately
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? data.plan : p));
        if (data.cacheMetrics) setCacheMetrics(data.cacheMetrics);
        // Refresh full stats
        fetchData(true);
      } else {
        showToast('error', data.error || 'Gagal mengubah harga.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format currency
  const formatRupiah = (val: number) => {
    return `Rp ${Number(val || 0).toLocaleString('id-ID')}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16 font-jakarta">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white shadow-emerald-600/20'
            : 'bg-rose-600 text-white shadow-rose-600/20'
        }`}>
          {toast.type === 'success' ? (
            <IconCheck className="w-5 h-5 shrink-0" />
          ) : (
            <IconAlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Paket & MRR
            </h1>
            <p className="text-sm text-slate-500">
              Kelola harga paket langganan Bizkit dan pantau pendapatan berulang (MRR).
            </p>
          </div>

          {/* Action Buttons & Cache Status Indicator */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <IconBolt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Otak Cache Aktif ({cacheMetrics?.hits || 0} hits)</span>
            </div>

            <button
              onClick={handleFlushCache}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all shadow-xs disabled:opacity-60"
              title="Perbarui data memori langsung dari database Neon"
            >
              <IconRefresh className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyegarkan...' : 'Refresh Otak Cache'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: MRR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Monthly Recurring Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <IconCurrencyDollar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
              {formatRupiah(stats.mrr)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <IconTrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>ARR: <strong>{formatRupiah(stats.arr)}</strong> / tahun</span>
            </div>
          </div>

          {/* Card 2: Pelanggan Aktif */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Pelanggan Premium Aktif
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IconCrown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
              {stats.activeSubscribers} <span className="text-sm font-semibold text-slate-500">UMKM</span>
            </div>
            <div className="text-xs text-slate-600">
              Konversi: <strong>{stats.conversionRate}%</strong> dari {stats.totalUsers} pengguna
            </div>
          </div>

          {/* Card 3: Harga Bulanan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Harga Premium Bulanan
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <IconCalendarTime className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight mb-1">
              {formatRupiah(stats.monthlyPrice)}
              <span className="text-xs font-semibold text-slate-500"> /bln</span>
            </div>
            <div className="text-xs text-slate-600">
              Paket fleksibel per 30 hari
            </div>
          </div>

          {/* Card 4: Harga Tahunan */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Harga Premium Tahunan
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <IconSparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight mb-1">
              {formatRupiah(stats.yearlyPrice)}
              <span className="text-xs font-semibold text-slate-500"> /thn</span>
            </div>
            <div className="text-xs text-slate-600">
              Setara <strong>{formatRupiah(Math.round(stats.yearlyPrice / 12))}</strong> /bulan
            </div>
          </div>
        </div>

        {/* Plans Management Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Daftar Paket Berlangganan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Khusus untuk mengubah harga paket. Perubahan langsung aktif di seluruh website tanpa perlu restart server.
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 self-start">
              Total {plans.length} Konfigurasi Paket
            </div>
          </div>

          {/* Cards / Table of Plans */}
          <div className="divide-y divide-slate-100">
            {plans.map((plan) => {
              const isFree = plan.id === 'free';
              const isMonthly = plan.billingCycle === 'monthly';
              const isAnnual = plan.billingCycle === 'annual';

              return (
                <div key={plan.id} className="p-6 sm:p-8 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          isFree 
                            ? 'bg-slate-100 text-slate-700 border-slate-200' 
                            : isMonthly 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {plan.badge || (isFree ? 'Paket Dasar' : isMonthly ? 'Bulanan' : 'Tahunan')}
                        </span>

                        <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-0.5 rounded-md">
                          Siklus: {isFree ? 'Selamanya (Free)' : isMonthly ? 'Per Bulan' : 'Per Tahun (12 Bulan)'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <IconCheck className="w-3 h-3" />
                          Status Aktif
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                        {plan.name}
                        {plan.id === 'premium_monthly' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-600 text-white font-semibold rounded-md">
                            Rekomendasi Utama
                          </span>
                        )}
                      </h3>

                      <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-4">
                        {plan.description}
                      </p>

                      {/* Feature Pills */}
                      <div className="flex flex-wrap gap-2">
                        {plan.features?.slice(0, 4).map((feat, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                            <IconCheck className="w-3 h-3 text-blue-600" />
                            {feat}
                          </span>
                        ))}
                        {plan.features && plan.features.length > 4 && (
                          <span className="text-xs text-slate-600 self-center">
                            +{plan.features.length - 4} fitur lainnya
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Price & Edit Action */}
                    <div className="flex sm:flex-col lg:items-end justify-between items-center gap-3 shrink-0 bg-slate-50/80 sm:bg-transparent p-4 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-500 font-semibold mb-0.5">
                          Harga Aktif Saat Ini
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {formatRupiah(plan.price)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {isFree ? '/selamanya' : isMonthly ? '/bulan' : '/tahun'}
                          </span>
                        </div>
                        {plan.originalPrice > plan.price && (
                          <div className="text-xs text-slate-500 line-through">
                            Harga Coret: {formatRupiah(plan.originalPrice)}
                          </div>
                        )}
                        {isAnnual && plan.price > 0 && (
                          <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                            Setara {formatRupiah(Math.round(plan.price / 12))} /bln
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => openEditModal(plan)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer"
                      >
                        <IconEdit className="w-4 h-4" />
                        <span>Ubah Harga</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Ubah Harga (Khusus mengubah harga saja sesuai instruksi) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <IconEdit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Ubah Harga Paket
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingPlan.name} ({editingPlan.billingCycle})
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePrice} className="p-6 space-y-5">
              {/* Input Harga Baru */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Harga Baru yang Ditagihkan (Rupiah) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value) || 0)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-lg font-extrabold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    placeholder="Contoh: 49000"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Terbaca: <strong>{formatRupiah(newPrice)}</strong> {editingPlan.billingCycle === 'monthly' ? '/bulan' : editingPlan.billingCycle === 'annual' ? '/tahun' : '/selamanya'}
                </p>
              </div>

              {/* Input Harga Coret / Normal (Opsional untuk promo) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Harga Coret / Normal (Opsional untuk Display Diskon)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(Number(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    placeholder="Contoh: 79000"
                  />
                </div>
                {newOriginalPrice > newPrice && (
                  <p className="text-xs text-emerald-600 mt-1 font-semibold">
                    Hemat {formatRupiah(newOriginalPrice - newPrice)} ({Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100)}% Diskon)
                  </p>
                )}
              </div>

              {/* Quick Presets for Convenient Editing */}
              {editingPlan.id !== 'free' && (
                <div>
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Preset Cepat:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingPlan.billingCycle === 'monthly' ? (
                      [29000, 39000, 49000, 59000, 69000, 79000, 99000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setNewPrice(preset);
                            setNewOriginalPrice(Math.round(preset * 1.5));
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                            newPrice === preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {formatRupiah(preset)}
                        </button>
                      ))
                    ) : (
                      [299000, 349000, 399000, 468000, 499000, 599000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setNewPrice(preset);
                            setNewOriginalPrice(Math.round(preset * 1.25));
                          }}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                            newPrice === preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {formatRupiah(preset)}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <IconInfoCircle className="w-4 h-4 text-blue-600" />
                  Pratinjau Tampilan di Halaman /harga:
                </div>
                <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{editingPlan.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {editingPlan.billingCycle === 'monthly' ? 'Tagihan Bulanan' : 'Tagihan Tahunan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-blue-600 block">
                      {formatRupiah(newPrice)}
                    </span>
                    {newOriginalPrice > newPrice && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {formatRupiah(newOriginalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <IconDeviceFloppy className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan & Update Otak Cache'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

