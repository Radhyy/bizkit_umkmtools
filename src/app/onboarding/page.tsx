'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Poppins, Plus_Jakarta_Sans } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconSparkles,
  IconBuildingStore,
  IconUsers,
  IconBrandTiktok,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBrandTwitter,
  IconCoin,
  IconMapPin,
  IconShoppingBag,
  IconCup,
  IconShirt,
  IconHeartHandshake,
  IconBriefcase,
  IconBrush,
  IconMoodSmile,
  IconVideo,
  IconEye,
  IconBulb,
} from '@tabler/icons-react';

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

const KATEGORI_OPTIONS = [
  { id: 'Kuliner & Makanan', label: 'Kuliner & Minuman', desc: 'Makanan berat, camilan, cafe & minuman kekinian', icon: IconCup },
  { id: 'Fashion & Busana', label: 'Fashion & Busana', desc: 'Pakaian, hijab, sepatu, tas & aksesoris', icon: IconShirt },
  { id: 'Kecantikan & Skincare', label: 'Kecantikan & Skincare', desc: 'Kosmetik, perawatan kulit & bodycare', icon: IconSparkles },
  { id: 'Retail & Kebutuhan Harian', label: 'Retail & Sembako', desc: 'Kelontong, buah segar, & perlengkapan rumah', icon: IconShoppingBag },
  { id: 'Jasa & Layanan', label: 'Jasa & Layanan', desc: 'Laundry, fotografi, bengkel, bimbel & desain', icon: IconBriefcase },
  { id: 'Kerajinan & Kriya', label: 'Kerajinan & Handmade', desc: 'Souvenir, kriya seni & produk custom', icon: IconBrush },
];

const AUDIENS_OPTIONS = [
  { id: 'Remaja & Gen-Z (15-24 thn)', label: 'Remaja & Gen-Z', desc: 'Suka tren viral, visual modern & cepat tanggap', icon: IconMoodSmile },
  { id: 'Mahasiswa & Pekerja Muda (20-35 thn)', label: 'Pekerja & Dewasa Muda', desc: 'Memiliki daya beli aktif untuk gaya hidup & kebutuhan harian', icon: IconUsers },
  { id: 'Ibu Rumah Tangga & Keluarga', label: 'Ibu Rumah Tangga & Keluarga', desc: 'Fokus pada kualitas bahan, keluarga & nilai hemat', icon: IconHeartHandshake },
  { id: 'Semua Kalangan / Publik', label: 'Semua Kalangan', desc: 'Produk universal untuk segala usia dan segmen pasar', icon: IconEye },
];

const PLATFORM_OPTIONS = [
  { id: 'TikTok', label: 'TikTok', desc: 'Video pendek dinamis berpotensi FYP & viral tinggi', icon: IconBrandTiktok },
  { id: 'Instagram', label: 'Instagram', desc: 'Reels, Story, dan Feed dengan sentuhan visual estetik', icon: IconBrandInstagram },
  { id: 'YouTube Shorts', label: 'YouTube Shorts', desc: 'Format video ringkas berjangkauan luas', icon: IconBrandYoutube },
  { id: 'X (Twitter)', label: 'X (Twitter)', desc: 'Thread ulasan, percakapan & komunitas online', icon: IconBrandTwitter },
];

const GAYA_OPTIONS = [
  { id: 'Review Jujur & Cicip Rasa', label: 'Review Jujur / Mukbang', desc: 'Ulasan langsung pengalaman mencoba produk secara otentik', icon: IconVideo },
  { id: 'Visual Estetik & Sinematik', label: 'Estetik & Sinematik', desc: 'Menonjolkan detail packaging dan keindahan visual produk', icon: IconSparkles },
  { id: 'Komedi & Sketsa Lucu', label: 'Komedi & Santai', desc: 'Penyampaian ringan dan menghibur yang disukai banyak orang', icon: IconMoodSmile },
  { id: 'Edukasi & Cerita Usaha', label: 'Edukasi & Storytelling', desc: 'Bercerita proses pembuatan dan manfaat produk bagi konsumen', icon: IconBulb },
];

const BUDGET_OPTIONS = [
  { id: '< Rp 500.000 / Barter Produk', label: 'Mikro / Barter Produk', desc: '< Rp 500.000 atau kirim produk gratis (Nano Influencer)' },
  { id: 'Rp 500.000 - Rp 2.000.000', label: 'Menengah (Micro)', desc: 'Rp 500.000 – Rp 2.000.000 untuk jangkauan lebih tertarget' },
  { id: '> Rp 2.000.000', label: 'Makro / Berpengaruh', desc: '> Rp 2.000.000 untuk kreator dengan interaksi follower tinggi' },
  { id: 'Fleksibel / Belum Ditentukan', label: 'Fleksibel', desc: 'Menyesuaikan dengan penawaran dan potensi kesepakatan' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Form State
  const [namaUsaha, setNamaUsaha] = useState('');
  const [kategoriBisnis, setKategoriBisnis] = useState('');
  const [deskripsiBisnis, setDeskripsiBisnis] = useState('');
  const [targetAudiens, setTargetAudiens] = useState('');
  const [kotaLokasi, setKotaLokasi] = useState('');
  const [platformFokus, setPlatformFokus] = useState('');
  const [gayaPromosi, setGayaPromosi] = useState('');
  const [budgetPromosi, setBudgetPromosi] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) {
        router.push('/login');
        return;
      }
      const u = JSON.parse(raw);
      if (!u?.id) {
        router.push('/login');
        return;
      }
      setCurrentUser(u);

      // Cek apakah user sudah punya profil bisnis sebelumnya
      fetch(`/api/onboarding?userId=${u.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.profile) {
            setNamaUsaha(data.profile.namaUsaha || '');
            setKategoriBisnis(data.profile.kategoriBisnis || '');
            setDeskripsiBisnis(data.profile.deskripsiBisnis || '');
            setTargetAudiens(data.profile.targetAudiens || '');
            setKotaLokasi(data.profile.kotaLokasi || '');
            setPlatformFokus(data.profile.platformFokus || '');
            setGayaPromosi(data.profile.gayaPromosi || '');
            setBudgetPromosi(data.profile.budgetPromosi || '');
          }
        })
        .catch(() => {});
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      if (!namaUsaha.trim()) {
        setErrorMsg('Mohon isi nama usaha atau toko Anda.');
        return;
      }
      if (!kategoriBisnis) {
        setErrorMsg('Pilih salah satu kategori bisnis yang paling cocok.');
        return;
      }
    } else if (currentStep === 2) {
      if (!targetAudiens) {
        setErrorMsg('Pilih target pelanggan utama usaha Anda.');
        return;
      }
    } else if (currentStep === 3) {
      if (!platformFokus) {
        setErrorMsg('Pilih platform media sosial utama yang ingin difokuskan.');
        return;
      }
      if (!gayaPromosi) {
        setErrorMsg('Pilih gaya konten atau ulasan yang paling Anda sukai.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setErrorMsg('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      setErrorMsg('Sesi akun tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          namaUsaha: namaUsaha.trim(),
          kategoriBisnis,
          deskripsiBisnis: deskripsiBisnis.trim(),
          targetAudiens,
          kotaLokasi: kotaLokasi.trim(),
          platformFokus,
          gayaPromosi,
          budgetPromosi: budgetPromosi || 'Fleksibel / Belum Ditentukan',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil bisnis');
      }

      // Update session lokal dengan profil terbaru
      const updatedUser = {
        ...currentUser,
        businessProfile: data.profile,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setIsCompleted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    // Jika user adalah admin atau premium, arahkan ke dashboard
    const role = currentUser?.role?.toLowerCase();
    if (role === 'admin' || role === 'premium') {
      router.push('/dashboard/influencer');
    } else {
      // Jika Free Plan, arahkan ke landing page section paket harga untuk aktivasi
      router.push('/#harga');
    }
  };

  return (
    <div className={`min-h-screen bg-[#a6cbff] relative overflow-hidden flex flex-col justify-between ${jakarta.className}`}>
      {/* Background Grid Pattern identik dengan Landing Page */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.8]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4' y='4' width='56' height='56' rx='20' ry='20' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.4)' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Blurred Center Glow (White) */}
      <div className="absolute top-[-20%] left-[10%] w-[80%] h-[120%] bg-white blur-[140px] rounded-[100%] pointer-events-none z-0" />
      <div className="absolute top-[30%] left-[-20%] w-[40%] h-[60%] bg-[#3b82f6] blur-[150px] rounded-[100%] pointer-events-none z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[50%] bg-[#2563eb] blur-[130px] rounded-[100%] pointer-events-none z-0" />

      {/* Top Navbar Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/PP-BizKit.png" alt="Bizkit" width={32} height={32} className="w-8 h-8 object-cover rounded-[10px] shadow-xs" priority />
          <span className={`text-xl font-bold text-slate-900 tracking-tight ${poppins.className}`}>bizkit</span>
        </Link>

        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 sm:px-3.5 py-1.5 rounded-full border border-white/60 shadow-xs text-[11px] sm:text-xs font-medium text-slate-600 shrink-0">
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
          <span className="hidden sm:inline">Survei Profil Bisnis UMKM</span>
          <span className="sm:hidden">Profil Bisnis</span>
        </div>
      </header>

      {/* Main Survey Card */}
      <main className="relative z-10 max-w-2xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/80">
          
          {/* Completed State */}
          {isCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 sm:py-8 space-y-5"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <IconCheck className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">
                  <IconSparkles className="w-3.5 h-3.5" /> Data Tersimpan di Sistem AI
                </span>
                <h2 className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ${poppins.className}`}>
                  Profil Bisnis Siap Digunakan!
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Terima kasih, <strong>{namaUsaha}</strong>! AI Bizkit kini telah memahami kategori bisnis dan target pelanggan Anda untuk menyaring rekomendasi influencer yang paling tepat.
                </p>
              </div>

              {/* Box Info Hasil Pengenalan */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Nama Usaha:</span>
                  <span className="font-semibold text-slate-800">{namaUsaha}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Kategori Bisnis:</span>
                  <span className="font-semibold text-slate-800">{kategoriBisnis}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-400">Target Pelanggan:</span>
                  <span className="font-semibold text-slate-800">{targetAudiens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform Utama:</span>
                  <span className="font-semibold text-slate-800">{platformFokus}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl text-sm shadow-lg shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Mulai Jelajahi Platform</span>
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div>
              {/* Step Progress Bar & Counter */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span className="text-blue-600">Langkah {currentStep} dari 4</span>
                  <span>{Math.round((currentStep / 4) * 100)}% selesai</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: '25%' }}
                    animate={{ width: `${(currentStep / 4) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Step Forms */}
              <AnimatePresence mode="wait">
                {/* STEP 1: NAMA USAHA & KATEGORI */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className={`text-xl sm:text-2xl font-bold text-slate-900 tracking-tight ${poppins.className}`}>
                        Apa nama & jenis usaha Anda?
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Informasi ini membantu AI menyaring influencer yang relevan di bidang produk Anda.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Nama Usaha / Merek Brand <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={namaUsaha}
                          onChange={(e) => setNamaUsaha(e.target.value)}
                          placeholder="Contoh: Kopi Seduh Santai, Bunga Hijab Store"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Pilih Kategori Bisnis Anda <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {KATEGORI_OPTIONS.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = kategoriBisnis === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setKategoriBisnis(cat.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                    : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                    {cat.label}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {cat.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Deskripsi Produk Singkat <span className="text-slate-400 font-normal">(opsional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={deskripsiBisnis}
                          onChange={(e) => setDeskripsiBisnis(e.target.value)}
                          placeholder="Contoh: Kami menjual aneka roti panggang dan kopi susu dengan bahan premium..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: TARGET PELANGGAN & LOKASI */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className={`text-xl sm:text-2xl font-bold text-slate-900 tracking-tight ${poppins.className}`}>
                        Siapa target pelanggan utama Anda?
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        AI akan memprioritaskan influencer yang memiliki demografi pengikut serupa.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Profil Audiens / Pelanggan <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {AUDIENS_OPTIONS.map((item) => {
                            const Icon = item.icon;
                            const isSelected = targetAudiens === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setTargetAudiens(item.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                    : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Kota / Wilayah Utama Usaha <span className="text-slate-400 font-normal">(opsional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={kotaLokasi}
                            onChange={(e) => setKotaLokasi(e.target.value)}
                            placeholder="Contoh: Jakarta Selatan, Bandung, atau Seluruh Indonesia (Online)"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                          <IconMapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PLATFORM & GAYA PROMOSI */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className={`text-xl sm:text-2xl font-bold text-slate-900 tracking-tight ${poppins.className}`}>
                        Platform & gaya promosi yang diinginkan
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Pilih saluran di mana Anda ingin produk UMKM Anda tampil paling efektif.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Platform Media Sosial Utama <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          {PLATFORM_OPTIONS.map((item) => {
                            const Icon = item.icon;
                            const isSelected = platformFokus === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setPlatformFokus(item.id)}
                                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                    : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                  {item.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Gaya Konten / Tipe Ulasan <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {GAYA_OPTIONS.map((item) => {
                            const Icon = item.icon;
                            const isSelected = gayaPromosi === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setGayaPromosi(item.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                    : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                    {item.label}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                    {item.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: BUDGET & RENCANA KOLABORASI */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className={`text-xl sm:text-2xl font-bold text-slate-900 tracking-tight ${poppins.className}`}>
                        Kisaran anggaran promosi UMKM Anda
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Sistem kami menyediakan rekomendasi dari influencer nano barter produk hingga kreator profesional.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {BUDGET_OPTIONS.map((item) => {
                        const isSelected = budgetPromosi === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBudgetPromosi(item.id)}
                            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                : 'border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                <IconCoin className="w-4 h-4" />
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <IconCheck className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <IconArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span>Sebelumnya</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Lanjutkan</span>
                    <IconArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <IconSparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-blue-400" />
                    <span>{loading ? 'Menyimpan...' : 'Simpan Profil & Selesai'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs text-slate-500">
        © 2026 Bizkit Indonesia. Seluruh data bisnis UMKM Anda tersimpan aman dan terenkripsi.
      </footer>
    </div>
  );
}

