"use client";
import React from 'react';
import Image from 'next/image';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IconDiamond, IconUsers, IconChartBar, IconReportAnalytics, IconWallet, IconBrain, IconSparkles, IconPencil } from '@tabler/icons-react';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

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
          <div className="inline-flex items-center justify-center gap-2.5 text-blue-600 font-bold text-[15px] mb-6 tracking-tight antialiased">
            <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
            <span className={poppins.className}>Fitur Unggulan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
            Perjalanan bisnis UMKM Anda, <br className="hidden md:block"/> dibuat jauh lebih simpel
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
            Catat keuangan dengan rapi, pantau laporan penjualan, dan manfaatkan asisten cerdas AI untuk memaksimalkan potensi bisnis Anda.
          </p>
        </div>

        {/* Feature List (Zigzag) */}
        <div className="flex flex-col gap-24 md:gap-32">
          {features.map((feat, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <div 
                key={feat.id} 
                className={`flex flex-col ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}
              >
                {/* Text Content */}
                <div className="flex-1 flex flex-col items-start text-left">
                  <h2 className="text-5xl md:text-6xl font-bold text-blue-600 mb-6 font-mono tracking-tighter">
                    {feat.id}
                  </h2>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-[17px] text-slate-600 leading-relaxed mb-8">
                    {feat.desc}
                  </p>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-full font-semibold text-sm">
                    {feat.icon} {feat.badge}
                  </div>
                </div>

                {/* Image Content */}
                <div className="flex-1 w-full max-w-lg mx-auto">
                  <div className="w-full relative drop-shadow-xl hover:-translate-y-2 transition-transform duration-500">
                    <Image 
                      src={feat.image} 
                      alt={feat.title} 
                      width={600} 
                      height={1200} 
                      className="w-full h-auto object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}
