"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  IconCrown,
  IconCheck,
  IconShieldCheck,
  IconLock,
  IconArrowRight,
  IconTag,
  IconQrcode,
  IconBuildingBank,
  IconCreditCard,
  IconSparkles,
  IconAlertCircle,
  IconConfetti,
  IconRefresh
} from '@tabler/icons-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

declare global {
  interface Window {
    snap: any;
  }
}

const PAYMENT_METHODS = [
  {
    id: 'qris',
    name: 'QRIS & E-Wallet',
    desc: 'GoPay, OVO, Dana, ShopeePay, LinkAja & BCA QR',
    badge: 'Paling Populer',
    icon: <IconQrcode className="w-5 h-5 text-blue-600" />
  },
  {
    id: 'bca_va',
    name: 'BCA Virtual Account',
    desc: 'Transfer instan otomatis dari m-BCA / KlikBCA',
    badge: 'Instan',
    icon: <IconBuildingBank className="w-5 h-5 text-blue-600" />
  },
  {
    id: 'mandiri_va',
    name: 'Mandiri Virtual Account',
    desc: 'Transfer via Livin by Mandiri & ATM Mandiri',
    badge: 'Instan',
    icon: <IconBuildingBank className="w-5 h-5 text-amber-600" />
  },
  {
    id: 'bni_va',
    name: 'BNI Virtual Account',
    desc: 'Transfer melalui BNI Mobile Banking & ATM',
    badge: 'Instan',
    icon: <IconBuildingBank className="w-5 h-5 text-emerald-600" />
  },
  {
    id: 'bri_va',
    name: 'BRI Virtual Account',
    desc: 'Transfer via BRImo & ATM BRI terdekat',
    badge: 'Instan',
    icon: <IconBuildingBank className="w-5 h-5 text-blue-500" />
  },
  {
    id: 'credit_card',
    name: 'Kartu Kredit / Debit',
    desc: 'Visa, Mastercard, JCB dengan perlindungan 3D Secure',
    badge: 'Global',
    icon: <IconCreditCard className="w-5 h-5 text-purple-600" />
  },
  {
    id: 'all',
    name: 'Semua Metode Pembayaran',
    desc: 'Pilih secara leluasa langsung di dalam jendela Midtrans',
    badge: 'Lengkap',
    icon: <IconSparkles className="w-5 h-5 text-indigo-600" />
  }
];

const PROMO_CODES: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  'BIZKITHEMAT': { type: 'percent', value: 20, label: 'Diskon 20%' },
  'UMKMMAJU': { type: 'fixed', value: 15000, label: 'Potongan Rp 15.000' },
  'SUPERADMIN': { type: 'percent', value: 50, label: 'Diskon Spesial 50%' },
  'LAUNCHING': { type: 'fixed', value: 10000, label: 'Potongan Rp 10.000' },
  'BIZKITPROMO': { type: 'percent', value: 10, label: 'Diskon 10%' },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ id: string; name: string; email: string; role?: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAlreadyPremium, setIsAlreadyPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Billing & Payment Selection
  const initialPlan = searchParams.get('plan') === 'yearly' ? 'yearly' : 'monthly';
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(initialPlan);
  const [selectedMethod, setSelectedMethod] = useState('qris');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Payment process state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Cek autentikasi dan status user
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }

    try {
      const parsed = JSON.parse(userData);
      setUser(parsed);

      // Verifikasi status terkini dari server
      fetch(`/api/auth/check-status?userId=${encodeURIComponent(parsed.id || '')}&email=${encodeURIComponent(parsed.email || '')}`)
        .then(res => res.json())
        .then(data => {
          setIsLoadingAuth(false);
          const currentRole = data.role || parsed.role;
          if (currentRole === 'premium') {
            setIsAlreadyPremium(true);
          } else if (currentRole === 'admin' || parsed.email?.toLowerCase() === 'radiaakbarradia@gmail.com') {
            setIsAdmin(true);
          }
        })
        .catch(() => {
          setIsLoadingAuth(false);
          if (parsed.role === 'premium') setIsAlreadyPremium(true);
          if (parsed.role === 'admin') setIsAdmin(true);
        });
    } catch (e) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
    }
  }, [router]);

  // Kalkulasi harga
  const basePrice = plan === 'yearly' ? 468000 : 49000;
  let discountAmount = 0;
  if (appliedCoupon && PROMO_CODES[appliedCoupon]) {
    const c = PROMO_CODES[appliedCoupon];
    if (c.type === 'percent') {
      discountAmount = Math.round((basePrice * c.value) / 100);
    } else {
      discountAmount = c.value;
    }
  }
  const finalPrice = Math.max(10000, basePrice - discountAmount);

  // Terapkan kupon
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError(null);

    if (!code) {
      setCouponError('Masukkan kode kupon diskon terlebih dahulu.');
      return;
    }

    if (PROMO_CODES[code]) {
      setAppliedCoupon(code);
      setCouponInput(code);
    } else {
      setCouponError('Kode kupon tidak valid atau sudah kedaluwarsa.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  // Proses Checkout ke Midtrans Snap
  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
      return;
    }

    if (isAlreadyPremium || isAdmin) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          plan,
          couponCode: appliedCoupon,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Gagal memulai transaksi Midtrans.');
      }

      // Pastikan Snap.js sudah termuat
      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(data.token, {
          onSuccess: async function (result: any) {
            console.log('Midtrans Payment Success:', result);
            // Verifikasi dan aktivasi ke backend
            try {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  orderId: data.orderId,
                  plan,
                }),
              });

              if (verifyRes.ok) {
                // Update local storage user
                const updated = { ...user, role: 'premium', isTrialActive: false };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);
                setPaymentSuccess(true);
              }
            } catch (err) {
              console.error('Error verifying payment:', err);
            }
            setIsProcessing(false);
          },
          onPending: function (result: any) {
            console.log('Midtrans Payment Pending:', result);
            alert('Pembayaran Anda sedang diproses. Silakan selesaikan transaksi sesuai instruksi.');
            setIsProcessing(false);
          },
          onError: function (result: any) {
            console.error('Midtrans Payment Error:', result);
            setErrorMessage('Pembayaran gagal atau dibatalkan oleh sistem.');
            setIsProcessing(false);
          },
          onClose: function () {
            setIsProcessing(false);
          },
        });
      } else {
        // Fallback jika script belum selesai load
        window.location.href = data.redirect_url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses checkout.');
      setIsProcessing(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className={`min-h-screen bg-[#F4F8FB] flex items-center justify-center ${jakarta.className}`}>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Memeriksa status akun Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F4F8FB] text-slate-800 ${jakarta.className} selection:bg-blue-600 selection:text-white pt-28 pb-20`}>
      {/* Midtrans Snap JS Script Loader (Sandbox) */}
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        strategy="afterInteractive"
      />

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 md:px-8">
        
        {/* State: Pengguna Sudah Memiliki Akun Premium */}
        {isAlreadyPremium ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-xl text-center"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <IconCrown className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Akun Anda Sudah Berstatus Premium! 🎉</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Akun <strong>{user?.email}</strong> telah memiliki paket <strong>Premium Aktif</strong> dengan akses tanpa batas ke semua fitur dashboard, pencatatan kas, dan asisten AI. Anda tidak perlu melakukan pembelian lagi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Dashboard</span>
                <IconArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-all"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </motion.div>
        ) : isAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-xl text-center"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <IconShieldCheck className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Akun Administrator</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Akun Anda berstatus <strong>Super Administrator</strong> dan telah memiliki hak akses penuh ke seluruh sistem platform Bizkit.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/admin"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Dashboard Admin</span>
                <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ) : paymentSuccess ? (
          /* State: Pembayaran Berhasil */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 md:p-10 border border-emerald-200 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <IconCheck className="w-9 h-9 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Pembayaran Berhasil! 🚀</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-8">
              Selamat! Akun Anda telah resmi ditingkatkan ke <strong>Paket Premium</strong>. Seluruh fitur dashboard, pencatatan kas realtime, dan kecerdasan buatan siap Anda gunakan.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Masuk ke Dashboard Sekarang</span>
              <IconArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          /* State: Halaman Checkout Utama */
          <div>
            {/* Header Section */}
            <div className="text-center max-w-2xl mx-auto pt-4 pb-10">
              <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-100 inline-block mb-3">
                Checkout Pembayaran Aman
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                Selesaikan Pembelian Paket Premium
              </h1>
              <p className="text-sm md:text-base text-slate-600">
                Pilih metode pembayaran favorit Anda dan nikmati seluruh kemudahan platform Bizkit tanpa batasan.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                <IconAlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Kolom Kiri: Pilihan Siklus & Custom UI Metode Pembayaran (7 Kolom) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Card Pilihan Siklus Tagihan */}
                <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold flex items-center justify-center">1</span>
                    Pilih Periode Langganan
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Bulanan */}
                    <div
                      onClick={() => setPlan('monthly')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        plan === 'monthly'
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">Paket Bulanan</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          plan === 'monthly' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {plan === 'monthly' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Fleksibel, dapat dibatalkan kapan saja.</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">Rp 49.000</span>
                        <span className="text-xs text-slate-500">/ bulan</span>
                      </div>
                    </div>

                    {/* Tahunan */}
                    <div
                      onClick={() => setPlan('yearly')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                        plan === 'yearly'
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">Paket Tahunan</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          plan === 'yearly' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {plan === 'yearly' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-xs text-emerald-600 font-semibold mb-3">Hemat 20% (Rp 39.000/bln)</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-slate-900">Rp 468.000</span>
                        <span className="text-xs text-slate-500">/ tahun</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Custom UI Pemilihan Metode Pembayaran */}
                <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold flex items-center justify-center">2</span>
                      Pilih Metode Pembayaran
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">Didukung Midtrans</span>
                  </div>

                  <div className="space-y-2.5">
                    {PAYMENT_METHODS.map((method) => {
                      const isSelected = selectedMethod === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/30 shadow-sm'
                              : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {method.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900">{method.name}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                                  {method.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-1">{method.desc}</p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Kolom Kanan: Rincian Pembelian & Kupon Diskon (5 Kolom) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Card Ringkasan Pembayaran */}
                <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-md">
                  <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                    Ringkasan Pesanan
                  </h3>

                  {/* Profil Akun Pembeli */}
                  <div className="p-3 bg-slate-50 rounded-2xl mb-5 flex items-center gap-3 border border-slate-100">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Pelanggan'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                      {user?.role || 'Free'}
                    </span>
                  </div>

                  {/* Input Kode Kupon Diskon */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Punya Kode Kupon Diskon?
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <IconTag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Misal: BIZKITHEMAT"
                          className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold uppercase rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                          disabled={!!appliedCoupon}
                        />
                      </div>
                      {appliedCoupon ? (
                        <button
                          onClick={handleRemoveCoupon}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors"
                        >
                          Hapus
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApplyCoupon()}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                        >
                          Terapkan
                        </button>
                      )}
                    </div>

                    {couponError && (
                      <p className="text-xs text-rose-600 mt-1.5 font-medium">{couponError}</p>
                    )}

                    {appliedCoupon && (
                      <p className="text-xs text-emerald-600 mt-1.5 font-semibold flex items-center gap-1">
                        <IconCheck className="w-3.5 h-3.5" />
                        Kupon <strong>{appliedCoupon}</strong> berhasil digunakan!
                      </p>
                    )}

                    {/* Kupon Rekomendasi Cepat */}
                    {!appliedCoupon && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="text-[11px] text-slate-500 mr-1 self-center font-medium">Coba:</span>
                        <button
                          onClick={() => handleApplyCoupon('BIZKITHEMAT')}
                          className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          BIZKITHEMAT (20%)
                        </button>
                        <button
                          onClick={() => handleApplyCoupon('UMKMMAJU')}
                          className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 rounded-md border border-amber-100 hover:bg-amber-100 transition-colors"
                        >
                          UMKMMAJU (15K)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rincian Harga */}
                  <div className="space-y-2.5 pb-5 border-b border-slate-100 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Paket Premium ({plan === 'yearly' ? '1 Tahun' : '1 Bulan'})</span>
                      <span className="font-semibold text-slate-800">
                        Rp {basePrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Diskon Kupon ({appliedCoupon})</span>
                        <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Layanan & Admin</span>
                      <span className="text-emerald-600 font-semibold">Gratis (Rp 0)</span>
                    </div>
                  </div>

                  {/* Total Pembayaran */}
                  <div className="pt-4 pb-6 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Pembayaran</p>
                      <p className="text-2xl font-extrabold text-blue-600 tracking-tight">
                        Rp {finalPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {plan === 'yearly' ? 'Sekali bayar / tahun' : 'Per bulan'}
                    </span>
                  </div>

                  {/* Tombol Eksekusi Bayar Sekarang */}
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className={`w-full bg-gradient-to-b from-[#0066FF] to-[#0047FF] hover:from-[#1a75ff] hover:to-[#003be6] text-white font-bold py-2.5 pl-6 pr-2.5 rounded-full flex items-center justify-between transition-all shadow-[0_8px_20px_rgba(0,71,255,0.25),inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-4px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_0px_0px_rgba(0,71,255,0),inset_0_4px_8px_rgba(0,0,0,0.2)] cursor-pointer ${
                      isProcessing ? 'opacity-80 cursor-wait' : ''
                    }`}
                  >
                    <span className="text-sm font-bold">
                      {isProcessing ? 'Menghubungkan ke Midtrans...' : 'Bayar Sekarang'}
                    </span>
                    <div className="bg-white text-[#0047FF] w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0">
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4 font-medium">
                    <IconShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Enkripsi 256-bit aman via Midtrans Payment Gateway</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={
      <div className={`min-h-screen bg-[#F4F8FB] flex items-center justify-center ${jakarta.className}`}>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Memuat halaman checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </React.Suspense>
  );
}
