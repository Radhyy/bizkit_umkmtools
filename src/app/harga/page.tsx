"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  IconCheck, 
  IconX, 
  IconSparkles, 
  IconCrown, 
  IconShieldCheck, 
  IconChevronDown, 
  IconChevronUp, 
  IconArrowRight, 
  IconLock,
  IconChartBar,
  IconBrain,
  IconFileSpreadsheet,
  IconUsers,
  IconReceipt2,
  IconHelp
} from '@tabler/icons-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

const comparisonFeatures = [
  { name: "Akses Dashboard Ringkasan Bisnis", free: false, premium: true, category: "Dasbor & Operasional" },
  { name: "Pencatatan Pemasukan & Pengeluaran Realtime", free: false, premium: true, category: "Dasbor & Operasional" },
  { name: "Laporan Finansial & Arus Kas Otomatis", free: false, premium: true, category: "Dasbor & Operasional" },
  { name: "AI Insight & Rekomendasi Tren Produk", free: false, premium: true, category: "Kecerdasan Buatan (AI)" },
  { name: "Asisten Bisnis AI 24/7 (Konsultasi Usaha)", free: false, premium: true, category: "Kecerdasan Buatan (AI)" },
  { name: "AI Content Builder (Copywriting Promosi)", free: false, premium: true, category: "Kecerdasan Buatan (AI)" },
  { name: "AI Influencer Matchmaking & Promosi", free: false, premium: true, category: "Pemasaran & Jangkauan" },
  { name: "Ekspor Riwayat & Laporan (Excel, CSV, PDF)", free: false, premium: true, category: "Data & Ekspor" },
  { name: "Penyimpanan Cloud Aman & Terenkripsi", free: "Hanya Profil", premium: "Tanpa Batas", category: "Keamanan" },
  { name: "Akses Landing Page & Panduan Platform", free: true, premium: true, category: "Layanan" },
  { name: "Dukungan Prioritas Tim Bizkit", free: false, premium: "Prioritas VIP", category: "Layanan" },
];

const faqs = [
  {
    q: "Apa perbedaan mendasar antara Free Plan dan Premium Plan?",
    a: "Free Plan ditujukan untuk melihat dan menjelajahi informasi platform, namun akses ke Dashboard, pencatatan keuangan, dan seluruh fitur AI dikunci. Sedangkan Premium Plan membuka seluruh dasbor, pencatatan kas tanpa batas, asisten AI 24/7, pencari influencer, serta ekspor laporan ke Excel dan PDF."
  },
  {
    q: "Apakah saya bisa mendapatkan masa trial untuk mencoba fitur Premium?",
    a: "Bisa! Super Administrator platform dapat mengaktifkan masa trial gratis selama beberapa hari untuk akun Anda, sehingga Anda dapat menikmati semua kemampuan Premium Plan sebelum memutuskan berlangganan."
  },
  {
    q: "Metode pembayaran apa saja yang disediakan?",
    a: "Bizkit terintegrasi dengan Payment Gateway Midtrans. Anda dapat membayar dengan mudah dan instan menggunakan QRIS (GoPay, OVO, Dana, ShopeePay, BCA QR), Transfer Virtual Account Bank (BCA, Mandiri, BNI, BRI, Permata), maupun kartu debit/kredit."
  },
  {
    q: "Bagaimana jika masa langganan atau masa trial saya berakhir?",
    a: "Jika masa langganan berakhir dan tidak diperpanjang, akun Anda akan otomatis kembali ke Free Plan (akses dashboard terkunci). Data dan riwayat transaksi yang tersimpan di cloud tetap aman dan tidak akan dihapus, sehingga siap diakses kembali saat Anda mengaktifkan Premium."
  },
  {
    q: "Apakah data keuangan dan bisnis saya terjamin keamanannya?",
    a: "Sangat terjamin. Semua database Bizkit menggunakan enkripsi modern SSL/TLS dengan infrastruktur cloud PostgreSQL berperforma tinggi yang terlindungi dan terisolasi per akun pengguna."
  }
];

export default function HargaPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className={`min-h-screen bg-[#F4F8FB] text-slate-800 ${jakarta.className} selection:bg-blue-600 selection:text-white pt-28 pb-20`}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header Hero Section */}
        <div className="text-center max-w-4xl mx-auto pt-6 pb-14 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-blue-600 text-sm font-semibold mb-6 shadow-sm"
          >
            <IconSparkles className="w-4 h-4 text-blue-600" />
            <span className={poppins.className}>Pilihan Paket Fleksibel</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.3] mb-6"
          >
            Investasi Cerdas untuk <br className="hidden sm:inline" />
            <span className="text-blue-600 inline-block">
              Pertumbuhan{" "}
              <span className="relative inline-block mx-1.5 -rotate-2 select-none align-baseline">
                {/* Figma Selection Bounding Box */}
                <span className="absolute -inset-1 border-[1.5px] border-blue-600 rounded-[2px] pointer-events-none" />
                
                {/* 4 Corner Square Handles */}
                <span className="absolute -top-2 -left-2 w-2.5 h-2.5 bg-white border-[1.5px] border-blue-600 pointer-events-none z-20" />
                <span className="absolute -top-2 -right-2 w-2.5 h-2.5 bg-white border-[1.5px] border-blue-600 pointer-events-none z-20" />
                <span className="absolute -bottom-2 -left-2 w-2.5 h-2.5 bg-white border-[1.5px] border-blue-600 pointer-events-none z-20" />
                <span className="absolute -bottom-2 -right-2 w-2.5 h-2.5 bg-white border-[1.5px] border-blue-600 pointer-events-none z-20" />
                
                {/* Figma Collaborator Cursor Tag at bottom-right */}
                <span className="absolute -bottom-5 -right-8 z-30 flex items-center gap-1.5 bg-blue-600 text-white rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-md pointer-events-none select-none">
                  <svg className="w-2.5 h-2.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                  </svg>
                  <span className="tracking-widest font-medium">Bizkit</span>
                </span>

                <span className="relative z-10 px-1 text-blue-600">
                  Bisnis
                </span>
              </span>{" "}
              UMKM Anda
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed mb-10"
          >
            Pilih paket yang sesuai dengan tahapan usaha Anda. Dapatkan kendali penuh atas arus kas, laporan otomatis, dan kecerdasan buatan dalam satu platform terpadu.
          </motion.p>

          {/* Billing Cycle Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex items-center gap-3 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm"
          >
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                !isYearly
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tagihan Bulanan
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                isYearly
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tagihan Tahunan
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${
                isYearly ? "bg-white text-blue-700" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}>
                Hemat 20%
              </span>
            </button>
          </motion.div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20 items-stretch">
          
          {/* Card 1: Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                  Paket Dasar
                </span>
                <span className="text-xs text-slate-500 font-medium">Akses Terbatas</span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">Free Plan</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Untuk pengguna baru yang ingin melihat gambaran platform. Akses dasbor dan seluruh fitur operasional dikunci.
              </p>

              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">Rp 0</span>
                  <span className="text-sm font-medium text-slate-500">/ selamanya</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">Tanpa biaya pendaftaran atau kartu kredit</p>
              </div>

              {/* Feature list for Free */}
              <div className="space-y-3.5 mb-8">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Fitur & Batasan:</p>
                
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>Akses Landing Page & Informasi Platform</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <IconLock className="w-3 h-3" />
                  </div>
                  <span className="line-through decoration-rose-300">Akses Dashboard UMKM (Terkunci)</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <IconX className="w-3.5 h-3.5" />
                  </div>
                  <span className="line-through decoration-rose-300">Catat Pemasukan & Pengeluaran Kas</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <IconX className="w-3.5 h-3.5" />
                  </div>
                  <span className="line-through decoration-rose-300">Laporan Keuangan & Grafik Otomatis</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <IconX className="w-3.5 h-3.5" />
                  </div>
                  <span className="line-through decoration-rose-300">Asisten AI 24/7 & AI Content Builder</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <IconX className="w-3.5 h-3.5" />
                  </div>
                  <span className="line-through decoration-rose-300">Cari Influencer & Matchmaking AI</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <IconX className="w-3.5 h-3.5" />
                  </div>
                  <span className="line-through decoration-rose-300">Ekspor Data (Excel, CSV, PDF)</span>
                </div>
              </div>
            </div>

            <Link
              href="/register"
              className="w-full py-3.5 px-6 text-center rounded-full font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 block shadow-sm"
            >
              Mulai dengan Free Plan
            </Link>
          </motion.div>

          {/* Card 2: Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md flex flex-col justify-between hover:shadow-lg transition-all relative"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider bg-blue-600 text-white rounded-full shadow-sm flex items-center gap-1.5">
                  <IconCrown className="w-3.5 h-3.5 text-amber-300" />
                  Paling Populer
                </span>
                <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Akses Penuh Tanpa Batas
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Premium Plan
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Membuka seluruh dasbor dan fitur pintar Bizkit untuk mengelola, menganalisis, dan melipatgandakan keuntungan UMKM Anda.
              </p>

              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {isYearly ? "Rp 39.000" : "Rp 49.000"}
                  </span>
                  <span className="text-sm font-medium text-slate-500">/ bulan</span>
                </div>
                <p className="text-xs text-blue-600 mt-1.5 font-semibold">
                  {isYearly ? "Ditagih Rp 468.000 per tahun (Hemat Rp 120.000)" : "Dapat dibatalkan atau diperpanjang kapan saja"}
                </p>
              </div>

              {/* Feature list for Premium */}
              <div className="space-y-3.5 mb-8">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Semua yang Anda Dapatkan:</p>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>Akses Penuh Dashboard UMKM</strong> realtime</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>Catat Pemasukan & Pengeluaran</strong> tanpa batas</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>Laporan Bisnis & Analisis Arus Kas</strong> otomatis</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>Asisten AI 24/7</strong> untuk solusi strategi bisnis Anda</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>AI Content Builder</strong> (Copywriting & caption otomatis)</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>AI Influencer Matchmaking</strong> untuk promosi produk</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>Ekspor Laporan Lengkap</strong> ke Excel, CSV & PDF</span>
                </div>

                <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <IconCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span><strong>Dukungan Prioritas VIP</strong> & penyimpanan cloud aman</span>
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/login?redirect=/harga"
                className="w-full bg-gradient-to-b from-[#0066FF] to-[#0047FF] hover:from-[#1a75ff] hover:to-[#003be6] text-white font-bold py-2 pl-6 pr-2 rounded-full flex items-center justify-between transition-all shadow-[0_8px_20px_rgba(0,71,255,0.25),inset_0_2px_0_rgba(255,255,255,0.25),inset_0_-4px_0_rgba(0,0,0,0.18)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_0px_0px_rgba(0,71,255,0),inset_0_4px_8px_rgba(0,0,0,0.2)] cursor-pointer"
              >
                <span className="text-[14px] md:text-[15px] font-bold">Upgrade ke Premium Sekarang</span>
                <div className="bg-white text-[#0047FF] w-9 h-9 rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              </Link>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-3 font-medium">
                <IconShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pembayaran aman via Midtrans (QRIS & Virtual Account)</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Comparison Table Section */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Perbandingan Lengkap Fitur
            </h3>
            <p className="text-sm md:text-base text-slate-600">
              Lihat secara mendalam apa yang didapatkan di masing-masing paket.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    <th className="py-4 px-6 text-sm font-bold text-slate-700 w-1/2">Fitur & Kemampuan</th>
                    <th className="py-4 px-6 text-sm font-bold text-slate-600 text-center w-1/4">Free Plan</th>
                    <th className="py-4 px-6 text-sm font-bold text-blue-600 text-center w-1/4 bg-blue-50/50">
                      Premium Plan ★
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonFeatures.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-800 font-medium">
                        {item.name}
                        <span className="block text-[11px] text-slate-500 font-normal">{item.category}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-center">
                        {typeof item.free === "boolean" ? (
                          item.free ? (
                            <div className="inline-flex w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center">
                              <IconCheck className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="inline-flex w-6 h-6 rounded-full bg-rose-100 text-rose-500 items-center justify-center">
                              <IconX className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          )
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.free}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-center bg-blue-50/20">
                        {typeof item.premium === "boolean" ? (
                          item.premium ? (
                            <div className="inline-flex w-6 h-6 rounded-full bg-blue-600 text-white items-center justify-center shadow-sm">
                              <IconCheck className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="inline-flex w-6 h-6 rounded-full bg-rose-100 text-rose-500 items-center justify-center">
                              <IconX className="w-4 h-4 stroke-[2.5]" />
                            </div>
                          )
                        ) : (
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                            {item.premium}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto mb-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
              <IconHelp className="w-3.5 h-3.5" />
              Pertanyaan Umum
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
              Ada yang Ingin Ditanyakan?
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-sm md:text-base">{faq.q}</span>
                    <div className={`p-1 rounded-full bg-slate-100 transition-transform ${isOpen ? "rotate-180 bg-blue-50 text-blue-600" : "text-slate-500"}`}>
                      <IconChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                      >
                        <p className="p-6 text-sm text-slate-600 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Banner (Style matched to SS 1 in Blue - Wider & Sleeker) */}
        <div className="w-full max-w-6xl mx-auto mb-20">
          <div className="relative overflow-hidden rounded-[32px] md:rounded-[36px] bg-gradient-to-b from-[#3b82f6] via-[#1d4ed8] to-[#1e40af] py-10 md:py-12 px-8 md:px-16 text-center text-white shadow-[0_20px_50px_-15px_rgba(29,78,216,0.3)] border border-blue-400/30">
            {/* Top Soft White Glow Ambient Diffuser */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[750px] h-[180px] bg-white/40 blur-[75px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <h3 className="text-2xl md:text-[30px] font-bold tracking-tight text-white leading-tight mb-2.5">
                Mulai Kelola dan Kembangkan Bisnis UMKM Anda Sekarang.
              </h3>
              <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-6 font-normal">
                Daftar sekarang untuk kemudahan pencatatan kas, asisten AI 24/7, dan otomatisasi laporan keuangan.
              </p>
              
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-2.5 bg-white text-slate-900 rounded-full font-bold text-sm shadow-md hover:bg-slate-50 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Daftar Sekarang</span>
                <IconArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

