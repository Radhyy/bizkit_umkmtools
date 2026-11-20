"use client";
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IconDiamond, IconUsers, IconChartBar, IconReportAnalytics, IconWallet, IconBrain, IconSparkles, IconPencil } from '@tabler/icons-react';

const jakarta = { className: 'font-jakarta' };
const poppins = { className: 'font-poppins' };

const features = [
  {
    id: "01",
    title: "Dashboard Ringkasan Bisnis",
    desc: "Pantau semua aktivitas bisnis, performa penjualan, dan operasional Anda dalam satu dasbor yang interaktif dan mudah dipahami.",
    image: "/GalleryFitur/1.DashboardRingkasanBisnis.png",
    badge: "Real-time Monitoring",
    icon: <IconChartBar className="w-4 h-4" />
  },
  {
    id: "02",
    title: "Catat Pemasukan & Pengeluaran",
    desc: "Rekam setiap transaksi masuk dan keluar dengan cepat. Ketahui persis ke mana arus uang bisnis Anda mengalir setiap harinya.",
    image: "/GalleryFitur/2.PemasukanDanPengeluaranPage.png",
    badge: "Manajemen Kas",
    icon: <IconWallet className="w-4 h-4" />
  },
  {
    id: "03",
    title: "Laporan Bisnis Komprehensif",
    desc: "Dapatkan laporan keuangan dan penjualan terperinci yang bisa langsung Anda unduh kapan saja tanpa perlu menyusun secara manual.",
    image: "/GalleryFitur/3.LaporanBisnisPage.png",
    badge: "Auto-Generate Laporan",
    icon: <IconReportAnalytics className="w-4 h-4" />
  },
  {
    id: "04",
    title: "Insight Bisnis Mendalam",
    desc: "Analisis performa produk terlaris, tren pasar, dan evaluasi strategi penjualan Anda berdasarkan data aktual dari operasional harian.",
    image: "/GalleryFitur/4.InsightBisnisPage.png",
    badge: "Data-Driven Decisions",
    icon: <IconDiamond className="w-4 h-4" />
  },
  {
    id: "05",
    title: "Cari Influencer yang Tepat",
    desc: "Temukan kreator konten atau influencer yang paling cocok dengan target pasar UMKM Anda untuk membantu mempromosikan produk.",
    image: "/GalleryFitur/5.InfoInfluencerPage.png",
    badge: "AI Matchmaking",
    icon: <IconUsers className="w-4 h-4" />
  },
  {
    id: "06",
    title: "AI Content Builder",
    desc: "Buat deskripsi produk, caption media sosial, hingga skrip video dengan bantuan AI yang dirancang khusus untuk meningkatkan konversi.",
    image: "/GalleryFitur/6.AiContentBuilderPage.png",
    badge: "Copywriting Otomatis",
    icon: <IconPencil className="w-4 h-4" />
  },
  {
    id: "07",
    title: "Asisten AI Pribadi Anda",
    desc: "Tanyakan apa saja seputar tips berbisnis, analisis masalah, hingga rekomendasi strategi langsung ke Asisten AI yang siap sedia.",
    image: "/GalleryFitur/7.AsistenAiPage.png",
    badge: "24/7 Support",
    icon: <IconBrain className="w-4 h-4" />
  }
];

export default function FiturPage() {
  return (
    <div className={`min-h-screen bg-[#F4F8FB] pt-32 pb-16 ${jakarta.className}`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-24">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center justify-center gap-2.5 text-blue-600 font-bold text-[15px] mb-6 tracking-tight antialiased"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
            </motion.div>
            <span className={poppins.className}>Fitur Unggulan</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6 leading-tight"
          >
            Perjalanan bisnis UMKM Anda, <br className="hidden md:block"/> dibuat jauh lebih simpel
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg text-slate-600 leading-relaxed max-w-2xl"
          >
            Catat keuangan dengan rapi, pantau laporan penjualan, dan manfaatkan asisten cerdas AI untuk memaksimalkan potensi bisnis Anda.
          </motion.p>
        </div>

        {/* Feature List (Zigzag) */}
        <div className="flex flex-col gap-24 md:gap-32">
          {features.map((feat, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <motion.div 
                key={feat.id} 
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}
              >
                {/* Text Content */}
                <motion.div 
                  initial={{ opacity: 0, x: isReversed ? 35 : -35 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
                  className="flex-1 flex flex-col items-start text-left"
                >
                  <motion.h2 
                    whileHover={{ scale: 1.08, x: isReversed ? -4 : 4 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className="text-5xl md:text-6xl font-bold text-blue-600 mb-6 font-mono tracking-tighter inline-block cursor-default select-none"
                  >
                    {feat.id}
                  </motion.h2>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-[17px] text-slate-600 leading-relaxed mb-8">
                    {feat.desc}
                  </p>
                  <motion.div 
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-full font-semibold text-sm cursor-default shadow-xs"
                  >
                    {feat.icon} {feat.badge}
                  </motion.div>
                </motion.div>

                {/* Image Content */}
                <motion.div 
                  initial={{ opacity: 0, x: isReversed ? -35 : 35, scale: 0.96 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
                  className="flex-1 w-full max-w-lg mx-auto"
                >
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full relative drop-shadow-xl"
                  >
                    <Image 
                      src={feat.image} 
                      alt={feat.title} 
                      width={600} 
                      height={1200} 
                      className="w-full h-auto object-contain"
                      unoptimized
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
