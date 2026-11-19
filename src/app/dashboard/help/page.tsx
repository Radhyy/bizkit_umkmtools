'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  IconHelpCircle,
  IconSearch,
  IconBrandWhatsapp,
  IconPhone,
  IconCopy,
  IconCheck,
  IconChevronDown,
  IconReceipt2,
  IconChartBar,
  IconBrain,
  IconSettings,
  IconExternalLink,
  IconMessageCircle,
  IconClock,
  IconSparkles,
  IconArrowRight,
  IconBook,
  IconShieldCheck,
  IconHeadset,
} from '@tabler/icons-react';

interface FAQItem {
  id: string;
  category: 'kas' | 'wa' | 'laporan' | 'ai' | 'akun';
  question: string;
  answer: string;
  actionText?: string;
  actionHref?: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'kas',
    question: 'Bagaimana cara mencatat transaksi pemasukan atau pengeluaran baru?',
    answer: 'Anda dapat mencatat transaksi dengan membuka menu "Keuangan & Kas", lalu klik tombol "+ Catat Transaksi". Pilih tipe (Pemasukan atau Pengeluaran), pilih kategori (seperti Bahan Baku, Penjualan, Operasional), isi nominal, tanggal, dan catatan singkat. Transaksi akan langsung terhitung ke laporan laba rugi.',
    actionText: 'Buka Keuangan & Kas',
    actionHref: '/dashboard/keuangan',
  },
  {
    id: 'faq-2',
    category: 'wa',
    question: 'Bagaimana format pesan ke WhatsApp Bot agar otomatis tercatat?',
    answer: 'Ketik pesan singkat dengan format: [Aksi/Barang] [Nominal]. Contoh Pengeluaran: "Beli gas 22000" atau "Beli minyak goreng 35rb". Contoh Pemasukan: "Jual 5 porsi nasi goreng 75000" atau "Pemasukan katering 500rb". AI Bizkit akan otomatis membaca keterangan, mengategorikan pos biaya, dan memasukkannya ke pembukuan Anda.',
    actionText: 'Hubungkan WhatsApp di Pengaturan',
    actionHref: '/dashboard/pengaturan',
  },
  {
    id: 'faq-3',
    category: 'laporan',
    question: 'Bagaimana cara melihat dan mengunduh laporan laba rugi bisnis?',
    answer: 'Kunjungi menu "Laporan Bisnis". Anda dapat melihat grafik arus pendapatan vs pengeluaran, margin laba bersih, serta ringkasan per bulan atau tanggal. Untuk menyimpan arsip, klik tombol "Unduh Laporan" dan pilih format PDF atau Excel.',
    actionText: 'Lihat Laporan Bisnis',
    actionHref: '/dashboard/laporan',
  },
  {
    id: 'faq-4',
    category: 'ai',
    question: 'Apa saja yang bisa saya tanyakan ke Asisten AI Bizkit?',
    answer: 'Asisten AI Bizkit dapat membantu menganalisis kesehatan keuangan, memberikan ide promosi lokal, merekomendasikan penentuan harga jual (HPP + margin), menyusun strategi penghematan biaya bahan, hingga menyusun copy broadcast WhatsApp untuk pelanggan Anda.',
    actionText: 'Coba Asisten AI',
    actionHref: '/dashboard/asisten',
  },
  {
    id: 'faq-5',
    category: 'akun',
    question: 'Bagaimana cara mengubah nama toko, logo usaha, dan informasi kontak?',
    answer: 'Buka menu "Settings" di sidebar. Pada bagian "Profil & Logo Toko", Anda dapat mengunggah logo usaha baru (format JPG, PNG, WEBP), mengubah nama brand, kategori usaha, nomor WhatsApp, serta alamat operasional.',
    actionText: 'Buka Pengaturan Akun',
    actionHref: '/dashboard/pengaturan',
  },
  {
    id: 'faq-6',
    category: 'akun',
    question: 'Apakah data keuangan dan transaksi UMKM saya aman?',
    answer: 'Sangat aman. Seluruh data transaksi tersimpan terenkripsi dengan otentikasi ketat. Data Anda bersifat privat dan hanya dapat diakses oleh akun Anda sendiri.',
  },
  {
    id: 'faq-7',
    category: 'kas',
    question: 'Bagaimana jika saya salah memasukkan nominal transaksi?',
    answer: 'Buka menu "Keuangan & Kas", cari transaksi pada tabel riwayat, lalu klik ikon pensil (Edit) di sebelah kanan baris transaksi. Anda bisa merevisi nominal, kategori, atau tanggal, lalu klik Simpan. Anda juga bisa menghapusnya bila tidak diperlukan.',
    actionText: 'Kelola Transaksi',
    actionHref: '/dashboard/keuangan',
  },
  {
    id: 'faq-8',
    category: 'wa',
    question: 'WhatsApp Bot tidak merespons, apa yang harus saya lakukan?',
    answer: 'Pastikan bot dalam status terhubung (centang hijau) di menu Pengaturan. Jika terputus, klik tombol "Tautkan Ulang WhatsApp" dan scan QR Code yang muncul. Bila masih ada kendala, Anda bisa langsung menghubungi Contact Person kami di 085738804915.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [copied, setCopied] = useState(false);

  const contactPhone = '085738804915';
  const whatsappUrl = `https://wa.me/6285738804915?text=${encodeURIComponent(
    'Halo Admin Bizkit, saya butuh bantuan terkait penggunaan aplikasi Bizkit UMKM Tools.'
  )}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(contactPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-8 font-jakarta pb-28">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
          <IconHelpCircle className="w-4 h-4" />
          <span>Pusat Bantuan & Dukungan Pengguna</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Ada yang Bisa Kami Bantu?
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
          Temukan panduan lengkap penggunaan fitur Bizkit, jawaban atas pertanyaan umum, atau hubungi langsung tim bantuan kami jika mengalami kendala.
        </p>
      </div>

      {/* Hero Contact Person Card (Highlight Utama Bantuan) */}
      <div className="bg-[#18181b] text-white rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Customer Support Siap Membantu
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Mengalami Kendala atau Bingung Memulai?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Tim support Bizkit siap membantu Anda memandu pembukuan usaha, konfigurasi WhatsApp Bot, hingga konsultasi fitur setiap hari.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-zinc-300">
              <span className="flex items-center gap-1.5 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                <IconClock className="w-3.5 h-3.5 text-amber-400" />
                Respon Cepat: 08:00 - 21:00 WIB
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                <IconShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Dukungan Resmi Bizkit
              </span>
            </div>
          </div>

          {/* Contact Box */}
          <div className="bg-zinc-800 rounded-2xl p-5 border border-zinc-700 sm:min-w-[320px] space-y-3.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Contact Person Bantuan
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-zinc-900 rounded-xl px-3.5 py-2.5 border border-zinc-700/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <IconPhone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400">Nomor Telepon / WhatsApp</div>
                  <div className="text-sm font-bold text-white tracking-wide font-mono">
                    0857-3880-4915
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Salin Nomor"
              >
                {copied ? (
                  <IconCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <IconCopy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 text-center"
              >
                <IconBrandWhatsapp className="w-4 h-4 shrink-0" />
                <span>Chat via WhatsApp</span>
              </a>
              <a
                href={`tel:${contactPhone}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-700/70 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl transition-colors border border-zinc-600/60"
              >
                <IconPhone className="w-4 h-4 text-zinc-300" />
                <span>Telepon</span>
              </a>
            </div>

            {copied && (
              <p className="text-center text-[11px] font-semibold text-emerald-400 animate-in fade-in">
                ✓ Nomor 085738804915 berhasil disalin ke clipboard!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4 Quick Guide Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <IconBook className="w-4 h-4 text-blue-600" />
          <span>Panduan Fitur Utama</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <IconReceipt2 className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900">1. Catat Arus Kas</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Catat setiap transaksi masuk & keluar secara disiplin untuk mendapatkan grafik laba rugi otomatis.
              </p>
            </div>
            <Link
              href="/dashboard/keuangan"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Buka Menu Kas</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IconBrandWhatsapp className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900">2. WhatsApp Bot</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Catat pengeluaran dan pemasukan cukup kirim pesan singkat via WhatsApp tanpa repot buka web.
              </p>
            </div>
            <Link
              href="/dashboard/pengaturan"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <span>Setup WhatsApp</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <IconBrain className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900">3. Konsultasi AI</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Tanya tips promosi, perhitungan margin produk, dan strategi scale-up ke Asisten AI Bizkit.
              </p>
            </div>
            <Link
              href="/dashboard/asisten"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700"
            >
              <span>Tanya AI Sekarang</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <IconChartBar className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900">4. Unduh Laporan</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Ekspor rekap keuangan dalam format PDF atau Excel siap cetak untuk pelaporan atau pembukuan.
              </p>
            </div>
            <Link
              href="/dashboard/laporan"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700"
            >
              <span>Lihat Laporan</span>
              <IconArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Cheatsheet Format WhatsApp Bot */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <IconMessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Contoh Format Chat Catat Otomatis via WhatsApp</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kirim pesan ke bot WhatsApp dengan bahasa santai sehari-hari, AI akan otomatis memprosesnya.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 self-start sm:self-auto">
            Fitur Praktis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
            <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Contoh Mencatat Pengeluaran
            </div>
            <ul className="text-xs text-zinc-600 space-y-1.5 font-mono">
              <li className="bg-white/80 p-2 rounded-xl border border-rose-100/80">
                &ldquo;Beli bubuk kopi nescafe 250k&rdquo;
              </li>
              <li className="bg-white/80 p-2 rounded-xl border border-rose-100/80">
                &ldquo;Beli bumbu dapur 45rb&rdquo;
              </li>
              <li className="bg-white/80 p-2 rounded-xl border border-rose-100/80">
                &ldquo;Bayar token listrik toko 100000&rdquo;
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Contoh Mencatat Pemasukan
            </div>
            <ul className="text-xs text-zinc-600 space-y-1.5 font-mono">
              <li className="bg-white/80 p-2 rounded-xl border border-emerald-100/80">
                &ldquo;Jualan bakso 150.000&rdquo;
              </li>
              <li className="bg-white/80 p-2 rounded-xl border border-emerald-100/80">
                &ldquo;Pemasukan katering lunch box 500rb&rdquo;
              </li>
              <li className="bg-white/80 p-2 rounded-xl border border-emerald-100/80">
                &ldquo;Laku 10 cup kopi susu 120000&rdquo;
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ Section with Search & Category Filter */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 tracking-tight">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Temukan solusi cepat dari kendala yang paling sering ditanyakan pengguna.
            </p>
          </div>

          {/* Search Bar FAQ */}
          <div className="relative min-w-[240px] sm:w-72">
            <IconSearch className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pertanyaan / topik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: 'Semua Topik' },
            { id: 'kas', label: 'Keuangan & Kas' },
            { id: 'wa', label: 'WhatsApp Bot' },
            { id: 'laporan', label: 'Laporan Bisnis' },
            { id: 'ai', label: 'Asisten AI' },
            { id: 'akun', label: 'Akun & Profil' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5 pt-2">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-xs">
              Tidak ada pertanyaan yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all ${
                    isOpen
                      ? 'border-zinc-300 bg-zinc-50/70 shadow-2xs'
                      : 'border-zinc-200/80 bg-white hover:border-zinc-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer gap-3"
                  >
                    <span className="text-xs sm:text-sm font-bold text-zinc-900">
                      {faq.question}
                    </span>
                    <IconChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-zinc-700' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 animate-in fade-in duration-150 space-y-3">
                      <p>{faq.answer}</p>
                      {faq.actionHref && (
                        <div>
                          <Link
                            href={faq.actionHref}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-[11px] font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors shadow-2xs"
                          >
                            <span>{faq.actionText}</span>
                            <IconArrowRight className="w-3 h-3 text-zinc-500" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Still Need Help Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-4 justify-center sm:justify-start">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IconHeadset className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900">Masih Butuh Bantuan Personal?</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Hubungi Contact Person kami di <strong>085738804915</strong> untuk dipandu langkah demi langkah.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <IconBrandWhatsapp className="w-4 h-4" />
            <span>Chat 085738804915</span>
          </a>
        </div>
      </div>
    </div>
  );
}

