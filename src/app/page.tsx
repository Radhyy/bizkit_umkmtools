"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Poppins, Plus_Jakarta_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600'] });

export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(2);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  
  const faqs = [
    { q: "Apa itu Bizkit?", a: "Bizkit adalah platform digital terpadu yang membantu para pemilik usaha mengelola pesanan, mencatat transaksi harian, dan memonitor laporan penjualan secara otomatis dalam satu aplikasi." },
    { q: "Bagaimana cara mulai menggunakan aplikasi ini?", a: "Anda hanya perlu membuat akun gratis dengan email atau nomor telepon. Setelah itu, Anda bisa langsung menambahkan daftar produk dan mulai mencatat pesanan pertama Anda tanpa ribet." },
    { q: "Apakah data pelanggan dan penjualan saya aman?", a: "Tentu. Semua data penjualan, pelanggan, dan riwayat pesanan Anda disimpan secara aman dengan enkripsi tingkat tinggi di cloud, sehingga tidak akan hilang dan terjamin kerahasiaannya." },
    { q: "Apakah aplikasi ini bisa digunakan di HP?", a: "Ya, Bizkit didesain sepenuhnya responsif sehingga sangat nyaman digunakan melalui smartphone, tablet, maupun laptop atau komputer kasir Anda." },
    { q: "Bisakah saya mengirimkan tagihan langsung ke pelanggan?", a: "Sangat bisa! Anda dapat membuat invoice dari setiap pesanan dan langsung membagikannya ke WhatsApp pelanggan hanya dengan satu klik." },
    { q: "Berapa biaya langganan Bizkit?", a: "Kami menyediakan paket dasar secara gratis yang sudah sangat cukup untuk bisnis pemula. Untuk fitur yang lebih advanced, kami menawarkan paket premium dengan harga yang bersahabat." },
  ];

  const testimonials = [
    { name: "Andi Kurniawan", role: "Pemilik Toko Sepatu", quote: "Aplikasi ini luar biasa! Omset bulanan saya tercatat lebih rapi, dan fitur ekspor ke Excel sangat membantu untuk rekap data harian.", initial: "AK", bg: "bg-blue-100", text: "text-blue-600" },
    { name: "Bunga Ratnasari", role: "Owner Bunga Hijab", quote: "Dulu sering pusing ngurus pesanan yang nyampur. Sejak pakai Bizkit, semua tertata otomatis. Pelanggan juga lebih senang karena fast response.", initial: "BR", bg: "bg-green-100", text: "text-green-600" },
    { name: "Budi Santoso", role: "Pemilik Kedai Kopi", quote: "Bizkit membuat konsultasi dan pengelolaan pesanan jauh lebih mudah tanpa stres. Pencatatan transaksi sangat simpel, dan saya bisa mengirim laporan dengan cepat setelah operasional selesai.", initial: "BS", bg: "bg-amber-100", text: "text-amber-600" },
    { name: "Diana Sastro", role: "Pengusaha Katering", quote: "Sangat mudah digunakan meski saya tidak terlalu melek teknologi. Pengaturan menunya fleksibel dan sangat cocok untuk operasional harian bisnis saya.", initial: "DS", bg: "bg-purple-100", text: "text-purple-600" },
    { name: "Eko Riyanto", role: "Reseller Gadget", quote: "Fitur notifikasi pesanan dan asisten AI-nya adalah yang terbaik! Sekarang saya tidak perlu lagi mikir keras untuk analisis omset. Sangat menghemat waktu.", initial: "ER", bg: "bg-pink-100", text: "text-pink-600" }
  ];

  const handleNextTestimonial = () => setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  const handlePrevTestimonial = () => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="min-h-screen font-sans bg-white">
      {/* Hero Wrapper */}
      <div className="bg-[#a6cbff] relative overflow-hidden pb-10">
      {/* Base Grid Layer (Liquid Glass Rounded Squares) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.8]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='4' y='4' width='56' height='56' rx='20' ry='20' fill='rgba(255,255,255,0.1)' stroke='rgba(255,255,255,0.4)' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Blurred Center Glow (White) */}
      <div className="absolute top-[-20%] left-[10%] w-[80%] h-[120%] bg-white blur-[140px] rounded-[100%] pointer-events-none z-0" />
      
      {/* Blurred Edge Glows (Blue) */}
      <div className="absolute top-[30%] left-[-20%] w-[40%] h-[60%] bg-[#3b82f6] blur-[150px] rounded-[100%] pointer-events-none z-0" />
      <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[50%] bg-[#2563eb] blur-[130px] rounded-[100%] pointer-events-none z-0" />

      {/* Navbar */}
      <Navbar />

      {/* Hero Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 text-center mt-28 md:mt-32">
        {/* Floating Badges */}
        <div className="hidden lg:flex absolute top-12 left-[-2%] xl:left-[2%] bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-3 pr-5 rounded-2xl items-center gap-3 animate-[float_6s_ease-in-out_infinite]">
          <div className="flex items-center justify-center -ml-1">
            <Image src="/Hero/Icon/IconCentangHijau.png" alt="Dipercaya" width={40} height={40} className="object-contain" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-[13px] font-medium text-slate-500">Dipercaya oleh</p>
            <p className="text-[15px] font-bold text-[#16a34a] tracking-tight">100+ UMKM</p>
          </div>
        </div>

        <div className="hidden lg:flex absolute top-28 right-[-5%] xl:right-[0%] bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-3 pr-5 rounded-2xl items-center gap-3 animate-[float_7s_ease-in-out_infinite_reverse]">
          <div className="flex items-center justify-center -ml-1">
             <Image src="/Hero/Icon/IconClockBiru.png" alt="Tersedia" width={40} height={40} className="object-contain" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-[15px] font-bold text-slate-800 tracking-tight">Tersedia</p>
            <p className="text-[13px] font-medium text-slate-500">24/7 Setiap Saat</p>
          </div>
        </div>

        <div className="hidden lg:flex absolute top-64 xl:top-[35%] left-[5%] xl:left-[10%] bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-5 py-3 rounded-2xl items-center gap-3 animate-[float_8s_ease-in-out_infinite]">
          <div className="flex items-center justify-center -ml-1">
             <Image src="/Hero/Icon/IconLaporanBiru.png" alt="Laporan" width={40} height={40} className="object-contain" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-[15px] font-bold text-blue-600 tracking-tight">Laporan Bisnis</p>
            <p className="text-[13px] font-medium text-slate-500">Otomatis & Akurat</p>
          </div>
        </div>

        <div className="hidden lg:flex absolute top-72 xl:top-[40%] right-[2%] xl:right-[8%] bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-5 py-3 rounded-2xl items-center gap-3 animate-[float_9s_ease-in-out_infinite_reverse]">
          <div className="flex items-center justify-center -ml-1">
             <Image src="/Hero/Icon/IconGlobeSecure.png" alt="Aman" width={40} height={40} className="object-contain" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-[15px] font-bold text-slate-800 tracking-tight">Data Terjaga</p>
            <p className="text-[13px] font-medium text-slate-500">Aman & Terenkripsi</p>
          </div>
        </div>

        {/* Small header pill */}
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-blue-100 shadow-sm animate-fade-in-up opacity-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
            <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
          </svg>
          UMKM, lebih praktis dan modern
        </div>

        {/* Main Headline */}
        <h1 className={`text-4xl md:text-[52px] lg:text-[64px] xl:text-[72px] font-bold text-slate-900 tracking-tight leading-[1.15] mb-6 w-full mx-auto ${poppins.className} animate-fade-in-up opacity-0 [animation-delay:100ms]`}>
          Kelola bisnis lebih baik <br className="hidden md:block" /> dengan akses yang lebih mudah
        </h1>

        {/* Subtitle */}
        <p className={`text-[17px] text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up opacity-0 [animation-delay:200ms] antialiased ${jakarta.className}`}>
          Catat transaksi, kelola inventaris, pantau laporan keuangan, dan temukan influencer yang tepat untuk mempromosikan bisnis Anda, semuanya dalam satu platform terpusat.
        </p>



        {/* Phones Section */}
        <div className="relative w-full max-w-4xl mx-auto h-[400px] md:h-[600px] flex justify-center mt-20 md:mt-28 animate-zoom-in opacity-0 [animation-delay:300ms]">
          <Image 
            src="/Hero/Phone1.png" 
            alt="Dashboard Mobile View" 
            width={340} 
            height={680} 
            className="absolute z-20 w-[240px] md:w-[320px] left-[10%] md:left-[22%] transform -translate-y-4 hover:-translate-y-8 transition-transform duration-500 drop-shadow-2xl rounded-[2rem]"
          />
          <Image 
            src="/Hero/Phone2.png" 
            alt="Transaction Mobile View" 
            width={340} 
            height={680} 
            className="absolute z-10 w-[220px] md:w-[280px] right-[10%] md:right-[26%] top-12 md:top-24 transform translate-y-4 hover:translate-y-0 transition-transform duration-500 drop-shadow-2xl rounded-[2rem]"
          />
        </div>

      </main>
      </div> {/* End Hero Wrapper */}

      {/* Section 2 */}
      <section className="relative w-full pt-16 pb-12 bg-[#f8fafc] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, ease: "easeOut" }} 
              viewport={{ once: true, margin: "50px" }}
              className="w-full lg:w-1/2 flex flex-col items-start text-left relative z-10"
            >
              <div className="inline-flex items-center gap-2.5 text-blue-600 font-bold text-[15px] mb-6 tracking-tight antialiased">
                <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
                <span className={poppins.className}>Praktis. Aman. Terpercaya.</span>
              </div>
              <h2 className={`text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.2] mb-6 ${poppins.className}`}>
                Dibuat untuk bisnis UMKM yang lebih efisien dan modern
              </h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-xl">
                Membantu pemilik bisnis mengelola penjualan, stok barang, pembukuan, dan database pelanggan dengan lebih cepat dan tanpa ribet.
              </p>
              
              <Link 
                href="/kontak" 
                className="inline-flex items-center gap-3 px-7 pt-3 pb-4 bg-gradient-to-b from-blue-500 to-blue-600 text-white text-base font-semibold rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-4px_0_rgba(29,78,216,1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(37,99,235,0.5),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-4px_0_rgba(29,78,216,1)] active:translate-y-[3px] active:pb-[13px] active:pt-[15px] active:shadow-[0_2px_8px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(29,78,216,1)]"
              >
                Get in Touch
                <div className="bg-white text-blue-600 rounded-full p-1 shadow-sm">
                   <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" /></svg>
                </div>
              </Link>
            </motion.div>

            {/* Right Content - Mockup */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }} 
              viewport={{ once: true, margin: "50px" }}
              className="w-full lg:w-1/2 relative flex justify-center lg:justify-end"
            >
              {/* Blurred Shapes Background */}
              <div className="absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 w-[95%] h-[95%] bg-blue-600/70 blur-[120px] rounded-full pointer-events-none z-0" />
              <div className="absolute top-1/2 left-[55%] -translate-x-1/2 -translate-y-1/2 w-[75%] h-[75%] bg-blue-500/80 blur-[90px] rounded-full pointer-events-none z-0" />
              
              {/* Dotted Grid Pattern */}
              <div className="absolute top-0 lg:top-1/2 left-1/2 -translate-x-1/2 translate-y-0 lg:-translate-y-1/2 w-[115%] sm:w-[125%] lg:w-[140%] h-[105%] lg:h-[140%] opacity-[0.9] pointer-events-none z-0" style={{
                backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px'
              }} />

              {/* The Image Mockup */}
              <div className="relative z-10 p-2">
                <Image 
                  src="/Section2Phone.png" 
                  alt="Feature Mockup" 
                  width={500} 
                  height={600} 
                  className="rounded-[40px] shadow-2xl object-cover w-full h-auto max-w-[480px] drop-shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
                />
              </div>
            </motion.div>

          </div>

          {/* Bottom Features Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }} 
            viewport={{ once: true, margin: "50px" }}
            className="mt-16 border-t border-slate-200/60 pt-10 flex flex-col items-center gap-8 max-w-5xl mx-auto"
          >
            {/* Top 3 Features */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full px-2 lg:px-12 gap-10 md:gap-0">
               <div className="flex items-center justify-center gap-3">
                  <Image src="/IconAksesBisnisTerpadu.png" alt="Akses Bisnis Terpadu" width={40} height={40} unoptimized={true} className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(34,197,94,0.4)]" />
                  <span className={`font-bold text-slate-800 text-[15px] tracking-tight antialiased ${poppins.className}`}>Akses Bisnis Terpadu</span>
               </div>
               
               <div className="flex items-center justify-center gap-3">
                  <Image src="/iconAsistenAIPintar.png" alt="Asisten AI" width={40} height={40} unoptimized={true} className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(59,130,246,0.4)]" />
                  <span className={`font-bold text-slate-800 text-[15px] tracking-tight antialiased ${poppins.className}`}>Asisten AI Pintar</span>
               </div>

               <div className="flex items-center justify-center gap-3">
                  <Image src="/IcomRekamDataAman.png" alt="Rekam Data Aman" width={40} height={40} unoptimized={true} className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(59,130,246,0.4)]" />
                  <span className={`font-bold text-slate-800 text-[15px] tracking-tight antialiased ${poppins.className}`}>Rekam Data Aman</span>
               </div>
            </div>

            {/* Bottom 2 Features */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full md:w-[50%] mx-auto gap-10 md:gap-0">
               <div className="flex items-center justify-center gap-3">
                  <Image src="/IconLaporanDigital.png" alt="Laporan Digital" width={40} height={40} unoptimized={true} className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(59,130,246,0.4)]" />
                  <span className={`font-bold text-slate-800 text-[15px] tracking-tight antialiased ${poppins.className}`}>Laporan Digital</span>
               </div>

               <div className="flex items-center justify-center gap-3">
                  <Image src="/IconInfoInfluencer.png" alt="Info Influencer" width={40} height={40} unoptimized={true} className="w-10 h-10 object-contain drop-shadow-[0_2px_4px_rgba(59,130,246,0.4)]" />
                  <span className={`font-bold text-slate-800 text-[15px] tracking-tight antialiased ${poppins.className}`}>Info Influencer</span>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3 - Core Features */}
      <section className="relative w-full py-20 bg-[#f4f8fc] overflow-hidden">
        {/* Background Blue Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-col items-start text-left mb-12"
          >
            <div className="inline-flex items-center gap-2.5 text-blue-600 font-bold text-[15px] mb-4 tracking-tight">
              <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
              <span className={poppins.className}>Fitur Utama</span>
            </div>
            <h2 className={`text-4xl md:text-[44px] font-bold text-slate-900 tracking-tight leading-[1.2] mb-6 w-full max-w-5xl ${poppins.className}`}>
              Semua yang Anda butuhkan <br className="hidden md:block" /> untuk mengelola bisnis lebih mudah
            </h2>
            <p className={`text-[17px] text-slate-600 max-w-2xl leading-relaxed ${jakarta.className}`}>
              Kelola pesanan, akses data pelanggan, pantau laporan, dan tetap terhubung melalui satu platform bisnis yang simpel.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            
            {/* Card 1: Akses Bisnis */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true, margin: "50px" }}
              className="col-span-1 md:col-span-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-start text-left"
            >
              <div className="flex items-center gap-3 mb-4">
                <Image src="/IconAksesBisnisTerpadu.png" alt="Akses" width={32} height={32} unoptimized={true} className="w-8 h-8" />
                <h3 className={`font-bold text-slate-900 text-[17px] ${poppins.className}`}>Akses Bisnis Terpadu</h3>
              </div>
              <p className={`text-sm text-slate-500 mb-8 ${jakarta.className}`}>Temukan semua informasi yang Anda butuhkan dengan cepat dan mudah.</p>
              {/* CSS Mockup */}
              <div className="flex-1 w-full min-h-[260px] bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col p-4 gap-4 relative overflow-hidden">
                 
                 {/* Top Search Bar */}
                 <div className="w-full h-11 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-3 gap-2 shrink-0 cursor-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                    <span className={`text-[11px] text-slate-400 ${jakarta.className}`}>Cari menu atau data...</span>
                    <div className="ml-auto px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-400 font-bold border border-slate-200">
                       ⌘K
                    </div>
                 </div>

                 <span className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${jakarta.className}`}>
                    Akses Cepat
                 </span>

                 {/* 2x2 Grid */}
                 <div className="grid grid-cols-2 gap-3 w-full flex-1">
                    {/* Item 1 */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center hover:-translate-y-1 hover:shadow-md hover:border-blue-200 transition-all group cursor-pointer">
                       <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center mb-2 group-hover:bg-blue-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 group-hover:text-white transition-colors"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                       </div>
                       <span className={`text-[11px] font-bold text-slate-700 ${poppins.className}`}>Laporan</span>
                    </div>

                    {/* Item 2 */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center hover:-translate-y-1 hover:shadow-md hover:border-green-200 transition-all group cursor-pointer">
                       <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center mb-2 group-hover:bg-green-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 group-hover:text-white transition-colors"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                       </div>
                       <span className={`text-[11px] font-bold text-slate-700 ${poppins.className}`}>Lokasi</span>
                    </div>

                    {/* Item 3 */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center hover:-translate-y-1 hover:shadow-md hover:border-orange-200 transition-all group cursor-pointer">
                       <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center mb-2 group-hover:bg-orange-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 group-hover:text-white transition-colors"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                       </div>
                       <span className={`text-[11px] font-bold text-slate-700 ${poppins.className}`}>Pelanggan</span>
                    </div>

                    {/* Item 4 */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center hover:-translate-y-1 hover:shadow-md hover:border-purple-200 transition-all group cursor-pointer">
                       <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center mb-2 group-hover:bg-purple-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 group-hover:text-white transition-colors"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
                       </div>
                       <span className={`text-[11px] font-bold text-slate-700 ${poppins.className}`}>Pengaturan</span>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Card 2: Asisten AI Pintar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} viewport={{ once: true, margin: "50px" }}
              className="col-span-1 md:col-span-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-start text-left"
            >
              <div className="flex items-center gap-3 mb-4">
                <Image src="/iconAsistenAIPintar.png" alt="Asisten AI" width={32} height={32} unoptimized={true} className="w-8 h-8" />
                <h3 className={`font-bold text-slate-900 text-[17px] ${poppins.className}`}>Asisten AI Pintar</h3>
              </div>
              <p className={`text-sm text-slate-500 mb-8 ${jakarta.className}`}>Bantu operasional dan optimasi bisnis secara otomatis melalui kecerdasan buatan.</p>
              {/* CSS Mockup */}
              <div className="flex-1 w-full min-h-[260px] bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col justify-end relative overflow-hidden p-4 gap-3">
                 {/* Top fade out effect */}
                 <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-slate-50/90 to-transparent z-10 pointer-events-none"></div>
                 
                 {/* Previous Faded AI Chat */}
                 <div className="flex justify-start items-end w-full gap-2 -mt-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-white">
                       <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    </div>
                    <div className={`bg-white border border-slate-200/60 text-slate-500 text-[11px] py-2 px-3.5 rounded-t-xl rounded-r-xl rounded-bl-sm shadow-sm max-w-[85%] ${jakarta.className}`}>
                       Laporan penjualan bulan ini sudah siap. Ada yang bisa dibantu lagi?
                    </div>
                 </div>

                 {/* User Chat */}
                 <div className="flex justify-end w-full mt-auto">
                    <div className={`bg-blue-600 text-white text-[11px] py-2 px-3.5 rounded-t-xl rounded-l-xl rounded-br-sm shadow-sm max-w-[85%] ${jakarta.className}`}>
                       Tolong buatkan draf caption IG promo!
                    </div>
                 </div>

                 {/* AI Chat */}
                 <div className="flex justify-start items-end w-full gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-white">
                       <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    </div>
                    <div className={`bg-white border border-slate-200/60 text-slate-600 text-[11px] py-2.5 px-3.5 rounded-t-xl rounded-r-xl rounded-bl-sm shadow-[0_4px_15px_-5px_rgba(0,0,0,0.05)] max-w-[85%] flex flex-col gap-1.5 ${jakarta.className}`}>
                       <span className="font-semibold text-slate-700">Tentu! Ini drafnya:</span>
                       <span className="leading-snug">"🎉 Kejutan Akhir Tahun! Dapatkan diskon s.d 50% untuk semua produk..."</span>
                       <div className="flex gap-1 mt-1">
                          <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                          <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse [animation-delay:200ms]"></span>
                          <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse [animation-delay:400ms]"></span>
                       </div>
                    </div>
                 </div>

                 {/* Input Bar */}
                 <div className="w-full h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-2.5 justify-between shrink-0">
                    <span className={`text-[11px] text-slate-400 ml-1 ${jakarta.className}`}>Ketik pesan ke AI...</span>
                    <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_2px_5px_rgba(37,99,235,0.3)]">
                       <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white -ml-0.5"><path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4Z"></path></svg>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Card 3: Rekam Data */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} viewport={{ once: true }}
              className="col-span-1 md:col-span-2 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-start text-left"
            >
              <div className="flex items-center gap-3 mb-4">
                <Image src="/IcomRekamDataAman.png" alt="Rekam Data" width={32} height={32} unoptimized={true} className="w-8 h-8" />
                <h3 className={`font-bold text-slate-900 text-[17px] ${poppins.className}`}>Rekam Data Aman</h3>
              </div>
              <p className={`text-sm text-slate-500 mb-8 ${jakarta.className}`}>Simpan data pelanggan dan transaksi dengan aman dan mudah diakses.</p>
              {/* CSS Mockup */}
              <div className="w-full h-[260px] relative flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_90%)] overflow-hidden mt-2">
                 
                 {/* Row 1 (Topmost) */}
                 <div className="absolute bottom-[calc(50%+74px)] left-1/2 -translate-x-1/2 px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Faktur Pembelian</span>
                 </div>

                 {/* Row 2 (Upper Middle) */}
                 <div className="absolute bottom-[calc(50%+26px)] right-[calc(50%+10px)] px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Riwayat Transaksi</span>
                 </div>
                 <div className="absolute bottom-[calc(50%+26px)] left-[calc(50%+10px)] px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Stok Gudang</span>
                 </div>

                 {/* Row 3 (Middle) */}
                 <div className="absolute right-[calc(50%+75px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Kontak Supplier</span>
                 </div>

                 {/* Center Blue Pill */}
                 <motion.div whileHover={{ scale: 1.05 }} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-4 py-2 bg-blue-600 rounded-[12px] shadow-[0_10px_20px_rgba(37,99,235,0.25)] flex items-center gap-2 cursor-pointer border border-blue-500 ${poppins.className}`}>
                    <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shadow-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                    </div>
                    <span className="text-white font-bold text-[12px] tracking-wide">Data Aman</span>
                 </motion.div>

                 <div className="absolute left-[calc(50%+75px)] top-1/2 -translate-y-1/2 px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"></path></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Arsip Tagihan</span>
                 </div>

                 {/* Row 4 (Lower Middle) */}
                 <div className="absolute top-[calc(50%+26px)] right-[calc(50%+10px)] px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Riwayat Chat</span>
                 </div>
                 <div className="absolute top-[calc(50%+26px)] left-[calc(50%+10px)] px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Jadwal Kirim</span>
                 </div>

                 {/* Row 5 (Bottommost) */}
                 <div className="absolute top-[calc(50%+74px)] left-1/2 -translate-x-1/2 px-3 py-2 bg-white rounded-[14px] shadow-sm border border-slate-50 flex items-center gap-2 w-max">
                    <div className="w-5 h-5 bg-[#f8fafc] rounded-md flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                    </div>
                    <span className={`text-slate-500 font-medium text-[11px] ${jakarta.className}`}>Laporan Harian</span>
                 </div>

              </div>
            </motion.div>

            {/* Card 4: Laporan Digital */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true, margin: "50px" }}
              className="col-span-1 md:col-span-3 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center text-left gap-8"
            >
              <div className="flex-1">
                <div className="flex items-center justify-start gap-3 mb-4">
                  <Image src="/IconLaporanDigital.png" alt="Laporan" width={32} height={32} unoptimized={true} className="w-8 h-8" />
                  <h3 className={`font-bold text-slate-900 text-[17px] ${poppins.className}`}>Laporan Digital</h3>
                </div>
                <p className={`text-sm text-slate-500 ${jakarta.className}`}>Pantau laporan secara digital agar data selalu tersedia dan terorganisir kapan saja.</p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center mt-6 md:mt-0 h-[220px] -mb-8">
                 {/* Stacked Cards Mockup */}
                 
                 {/* Back card 1 */}
                 <div className="absolute top-4 w-[220px] h-10 bg-slate-100 rounded-t-2xl shadow-sm border border-slate-200"></div>
                 {/* Back card 2 */}
                 <div className="absolute top-8 w-[250px] h-10 bg-[#f8fafc] rounded-t-2xl shadow-sm border border-slate-200 z-10"></div>
                 
                 {/* Main Front Card */}
                 <div className="absolute top-12 w-[280px] h-[172px] bg-white rounded-t-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-slate-100 z-20 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform">
                    {/* Header */}
                    <div className="w-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                          <span className="text-white font-semibold text-[15px]">Laporan</span>
                       </div>
                       <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><path d="M12 5v14M5 12h14"/></svg>
                          <span className="text-slate-800 font-semibold text-[11px]">Tambah</span>
                       </div>
                    </div>
                    {/* Body / List */}
                    <div className="flex-1 px-5 pt-4 flex flex-col gap-4 bg-white">
                       {/* Item 1 */}
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/></svg>
                          </div>
                          <div className="flex flex-col flex-1 text-left min-w-0">
                             <span className="text-[11px] font-bold text-slate-800 truncate">Laporan Penjualan - 15 April</span>
                             <span className="text-[10px] text-slate-400 mt-0.5">April 15, 2026</span>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 shrink-0"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                       </div>
                       {/* Item 2 */}
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                          </div>
                          <div className="flex flex-col flex-1 text-left min-w-0">
                             <span className="text-[11px] font-bold text-slate-800 truncate">Laporan Laba Rugi Bulanan</span>
                             <span className="text-[10px] text-slate-400 mt-0.5">April 30, 2026</span>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-slate-400 shrink-0"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Card 5: Info Influencer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} viewport={{ once: true, margin: "50px" }}
              className="col-span-1 md:col-span-3 bg-white/90 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center text-left gap-8"
            >
              <div className="flex-1">
                <div className="flex items-center justify-start gap-3 mb-4">
                  <Image src="/IconInfoInfluencer.png" alt="Influencer" width={32} height={32} unoptimized={true} className="w-8 h-8" />
                  <h3 className={`font-bold text-slate-900 text-[17px] ${poppins.className}`}>Info Influencer</h3>
                </div>
                <p className={`text-sm text-slate-500 ${jakarta.className}`}>Temukan dan kelola data influencer/KOL yang tepat untuk bantu promosikan bisnis Anda.</p>
              </div>
              <div className="w-full md:w-1/2 relative flex justify-center mt-6 md:mt-0 h-[220px] -mb-8">
                 {/* Half iPhone Base */}
                 <div className="w-48 h-full bg-[#f8fafc] border-x border-t border-slate-200/80 rounded-t-[36px] relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)] mt-auto">
                    {/* Dark Notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-800 rounded-full"></div>
                    
                    {/* Floating Pop-Up 1 */}
                    <div className="absolute top-12 -left-16 w-[260px] bg-white rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08)] p-3 border border-slate-100 flex gap-3 items-center z-10 transition-transform hover:scale-105">
                       <img src="/InfluencerFoto/Sarah(FoodVlogger).png" alt="Sarah" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                       <div className="flex flex-col text-left w-full">
                          <div className="flex justify-between items-center w-full">
                             <span className="text-[12px] font-bold text-slate-800">Sarah (Food Vlogger)</span>
                             <span className="text-[9px] text-slate-400">10:30 AM</span>
                          </div>
                          <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                             Influencer yang mungkin sesuai dengan bisnis Anda.
                          </span>
                       </div>
                    </div>

                    {/* Floating Pop-Up 2 */}
                    <div className="absolute top-32 -right-10 w-[240px] bg-white rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.08)] p-3 border border-slate-100 flex gap-3 items-center z-10 transition-transform hover:scale-105">
                       <img src="/InfluencerFoto/Budi(TechReview).png" alt="Budi" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                       <div className="flex flex-col text-left w-full">
                          <div className="flex justify-between items-center w-full">
                             <span className="text-[12px] font-bold text-slate-800">Budi (Tech Review)</span>
                             <span className="text-[9px] text-slate-400">10:32 AM</span>
                          </div>
                          <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                             Siap bantu promosi!
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Hand Phone Section */}
      <div className="relative w-full overflow-hidden">
         {/* Background Effects (Blur + Liquid Glass Grid) */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute top-0 -right-20 md:top-20 md:right-[-200px] w-[450px] h-[350px] bg-[#0047FF] rounded-[100%] blur-[100px] rotate-[30deg] pointer-events-none z-0"
         ></motion.div>
         <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="absolute top-10 -right-20 md:top-28 md:right-[-250px] w-[400px] h-[400px] pointer-events-none z-0"
            style={{ maskImage: 'radial-gradient(circle at top right, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at top right, black 20%, transparent 70%)' }}
         >
            <div className="w-full h-full bg-white/5 backdrop-blur-[4px]" 
                 style={{ 
                    maskImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='10' fill='black'/%3E%3C/svg%3E")`,
                    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='10' fill='black'/%3E%3C/svg%3E")`
                 }}>
            </div>
         </motion.div>

         <section className="relative w-full max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-0 z-10">

         {/* Header */}
         <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "50px" }}
            className="flex flex-col items-start text-left w-full max-w-[1050px] mb-16 relative z-10"
         >
            <div className="inline-flex items-center gap-2.5 text-blue-600 font-bold text-[15px] mb-6 tracking-tight antialiased">
               <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
               <span className={poppins.className}>Untuk UMKM</span>
            </div>
            <h2 className={`text-4xl md:text-[44px] lg:text-[50px] font-bold text-[#0f172a] leading-[1.2] tracking-tight ${poppins.className}`}>
               Dibangun untuk UMKM yang ingin <br className="hidden md:block" /> mengelola bisnis dengan lebih lancar <br className="hidden md:block" /> dan terpusat
            </h2>
         </motion.div>

         {/* Content Grid */}
         <div className="relative w-full flex flex-col md:flex-row items-center justify-between gap-12 mt-16 z-10">
            
            {/* Left Features */}
            <div className="flex flex-col gap-16 w-full md:w-1/3">
               <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  </div>
                  <h3 className={`text-[19px] font-bold text-[#0f172a] mt-2 ${poppins.className}`}>Kelola Pesanan Mudah</h3>
                  <p className={`text-sm text-slate-500 leading-relaxed ${jakarta.className}`}>Tangani pemesanan, jadwal ulang, dan tugas harian lebih efisien dengan sistem yang didesain agar tetap rapi.</p>
               </motion.div>
               
               <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.5 1.45 4.75 3.7 6.13-.19 1.44-.8 3.1-2.4 4.54.02.04.05.08.08.1.58.4 1.4.67 2.41.52 2.37-.36 4.45-1.74 5.8-2.91 1.25.4 2.62.62 4.05.62 5.52 0 10-3.58 10-8s-4.48-8-10-8zm-3 9H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/></svg>
                  </div>
                  <h3 className={`text-[19px] font-bold text-[#0f172a] mt-2 ${poppins.className}`}>Chat Aman di Aplikasi</h3>
                  <p className={`text-sm text-slate-500 leading-relaxed ${jakarta.className}`}>Berkomunikasi secara privat dengan pelanggan melalui pesan yang aman untuk follow-up dan koordinasi.</p>
               </motion.div>
            </div>

            {/* Center Phone Image */}
            <div className="w-full md:w-1/3 flex justify-center self-end relative pt-10 pb-0">
               <motion.div initial={{ y: 50, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, type: "spring", bounce: 0.4 }} viewport={{ once: true }}>
                  <Image src="/HandBringPhone.png" alt="Hand holding phone" width={400} height={600} unoptimized={true} className="relative z-10 w-full max-w-[340px] object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.25)] translate-y-[1px]" />
               </motion.div>
            </div>
            {/* Right Features */}
            <div className="flex flex-col gap-16 w-full md:w-1/3">
               <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 15"/></svg>
                  </div>
                  <h3 className={`text-[19px] font-bold text-[#0f172a] mt-2 ${poppins.className}`}>Riwayat Penjualan</h3>
                  <p className={`text-sm text-slate-500 leading-relaxed ${jakarta.className}`}>Akses penjualan masa lalu, detail produk, dan catatan pelanggan dalam satu tampilan terorganisir.</p>
               </motion.div>
               
               <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h3 className={`text-[19px] font-bold text-[#0f172a] mt-2 ${poppins.className}`}>Hubungkan dengan Pelanggan</h3>
                  <p className={`text-sm text-slate-500 leading-relaxed ${jakarta.className}`}>Dukung pelanggan setelah pembelian dengan panduan tepat waktu dan pengalaman komunikasi yang lebih terhubung.</p>
               </motion.div>
            </div>

         </div>
      </section>
      </div>

      {/* Testimonial Section */}
      <div className="relative w-full overflow-hidden bg-white pt-24 pb-32">
         {/* Background Effects (Blur + Liquid Glass Grid) */}
         <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute bottom-[-200px] left-[-10%] w-[120%] h-[450px] bg-[#0047FF] opacity-50 blur-[120px] rounded-[100%] pointer-events-none z-0"
         ></motion.div>
         <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute bottom-[-100px] right-[-100px] w-[700px] h-[550px] bg-[#0047FF] opacity-90 blur-[130px] rounded-[100%] pointer-events-none z-0"
         ></motion.div>

         <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="absolute bottom-[-20px] left-0 w-full h-[600px] pointer-events-none z-0"
            style={{ 
               maskImage: 'linear-gradient(to top, black 20%, transparent 100%)', 
               WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 100%)' 
            }}
         >
            <div className="w-full h-full bg-white/5 backdrop-blur-[4px]" 
                 style={{ 
                    maskImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='10' fill='black'/%3E%3C/svg%3E")`,
                    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='10' fill='black'/%3E%3C/svg%3E")`
                 }}>
            </div>
         </motion.div>

         <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
            {/* Label */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6 }}
               viewport={{ once: true }}
               className="inline-flex items-center gap-2.5 text-blue-600 font-bold text-[15px] mb-6 tracking-tight antialiased"
            >
               <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
               <span className={poppins.className}>Cerita UMKM</span>
            </motion.div>
            
            {/* Title */}
            <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.1 }}
               viewport={{ once: true }}
               className={`text-4xl md:text-[44px] lg:text-[50px] font-bold text-[#0f172a] leading-[1.2] tracking-tight mb-4 ${poppins.className}`}
            >
               Apa kata pengguna kami
            </motion.h2>
            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               viewport={{ once: true }}
               className={`text-slate-600 text-[17px] max-w-2xl leading-relaxed mb-12 ${jakarta.className}`}
            >
               Lihat mengapa ribuan UMKM mempercayakan bisnisnya pada Bizkit untuk pengelolaan pesanan yang lebih mudah, akses cepat, dan pengalaman pelanggan yang lebih baik.
            </motion.p>

            {/* Avatars */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.6, delay: 0.3 }}
               viewport={{ once: true }}
               className="flex items-center justify-center mb-12"
            >
               {testimonials.map((ava, i) => (
                  <div 
                     key={i} 
                     onClick={() => setActiveTestimonial(i)}
                     className={`${i === activeTestimonial ? 'w-16 h-16 z-20 shadow-[0_10px_20px_rgba(0,0,0,0.1)] border-4' : 'w-12 h-12 z-10 border-[3px] opacity-70 hover:opacity-100'} border-white ${ava.bg} ${ava.text} rounded-full flex items-center justify-center font-bold text-sm -ml-4 first:ml-0 shadow-sm relative transition-all duration-300 hover:z-30 hover:-translate-y-1 cursor-pointer`}
                  >
                     {ava.initial}
                  </div>
               ))}
            </motion.div>

            {/* Testimonial Card */}
            <motion.div 
               initial={{ opacity: 0, y: 40 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
               viewport={{ once: true }}
               className="bg-white/80 backdrop-blur-xl border border-blue-200/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[32px] p-8 md:p-14 w-full max-w-3xl relative"
            >
               {/* Quotes */}
               <div className="absolute top-10 left-6 md:top-14 md:left-10 text-blue-500 opacity-90">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 11H6C6 8.23858 8.23858 6 11 6V4C7.13401 4 4 7.13401 4 11V19H10V11ZM20 11H16C16 8.23858 18.23858 6 21 6V4C17.134 4 14 7.13401 14 11V19H20V11Z"/></svg>
               </div>
               <div className="absolute bottom-28 right-6 md:bottom-32 md:right-10 text-blue-500 opacity-90 rotate-180">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 11H6C6 8.23858 8.23858 6 11 6V4C7.13401 4 4 7.13401 4 11V19H10V11ZM20 11H16C16 8.23858 18.23858 6 21 6V4C17.134 4 14 7.13401 14 11V19H20V11Z"/></svg>
               </div>

               <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
               >
                  <p className={`text-slate-700 text-[19px] md:text-[22px] leading-[1.6] px-8 md:px-16 mb-8 text-center font-medium ${jakarta.className}`}>
                     "{testimonials[activeTestimonial].quote}"
                  </p>

                  {/* Stars */}
                  <div className="flex justify-center gap-1.5 mb-5">
                     {[1,2,3,4,5].map(star => (
                        <svg key={star} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#EAB308" stroke="#EAB308" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                     ))}
                  </div>

                  <div className="flex flex-col items-center">
                     <h4 className={`font-bold text-slate-900 text-[17px] mb-1 ${poppins.className}`}>{testimonials[activeTestimonial].name}</h4>
                     <p className={`text-slate-500 text-sm font-medium ${jakarta.className}`}>{testimonials[activeTestimonial].role}</p>
                  </div>
               </motion.div>
            </motion.div>

            {/* Navigation Arrows */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.6 }}
               viewport={{ once: true }}
               className="flex items-center gap-4 mt-12"
            >
               <button onClick={handlePrevTestimonial} className="w-12 h-12 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               </button>
               <button onClick={handleNextTestimonial} className="w-12 h-12 rounded-full bg-blue-600 shadow-[0_8px_16px_rgba(37,99,235,0.25)] flex items-center justify-center text-white hover:bg-blue-700 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
               </button>
            </motion.div>
         </div>
      </div>

      {/* FAQ Section */}
      <section className="w-full bg-[#f8fafc] py-24 md:py-32 border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
               
               {/* Left Column (Text & Contact) */}
               <div className="w-full lg:w-[40%] flex flex-col items-start">
                  <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6 }}
                     viewport={{ once: true }}
                     className="inline-flex items-center gap-2.5 text-blue-600 font-bold text-[15px] mb-6 tracking-tight antialiased"
                  >
                     <Image src="/IconDiamond.png" alt="Diamond" width={28} height={28} unoptimized={true} className="w-7 h-7 object-contain translate-y-[-1px]" />
                     <span className={poppins.className}>FAQs</span>
                  </motion.div>
                  
                  <motion.h2 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.1 }}
                     viewport={{ once: true }}
                     className={`text-[36px] md:text-[42px] font-bold text-[#0f172a] leading-[1.2] tracking-tight mb-4 ${poppins.className}`}
                  >
                     Jawaban untuk pertanyaan umum
                  </motion.h2>
                  
                  <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.2 }}
                     viewport={{ once: true }}
                     className={`text-slate-500 text-[17px] leading-relaxed mb-10 md:mb-20 ${jakarta.className}`}
                  >
                     Temukan jawaban cepat tentang fitur, keamanan, harga, dan cara Bizkit membantu bisnis Anda berkembang.
                  </motion.p>

                  <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     transition={{ duration: 0.6, delay: 0.3 }}
                     viewport={{ once: true }}
                     className="flex flex-col items-start"
                  >
                     <h3 className={`text-[22px] font-bold text-slate-900 mb-2 ${poppins.className}`}>Punya pertanyaan lain?</h3>
                     <p className={`text-slate-500 text-[15px] mb-8 ${jakarta.className}`}>Hubungi kami untuk info lebih lanjut.</p>
                     
                     <button className={`bg-gradient-to-b from-[#0066FF] to-[#0047FF] hover:from-[#1a75ff] hover:to-[#003be6] text-white font-semibold py-2 pl-6 pr-2 rounded-[20px] flex items-center gap-4 transition-all shadow-[0_8px_20px_rgba(0,71,255,0.25),inset_0_2px_0_rgba(255,255,255,0.2),inset_0_-4px_0_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_0px_0px_rgba(0,71,255,0),inset_0_4px_8px_rgba(0,0,0,0.2)] cursor-pointer ${jakarta.className}`}>
                        <span className="text-[15px]">Hubungi Kami</span>
                        <div className="bg-white text-[#0047FF] w-9 h-9 rounded-full flex items-center justify-center shadow-sm">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                        </div>
                     </button>
                  </motion.div>
               </div>

               {/* Right Column (Accordion) */}
               <div className="w-full lg:w-[60%] flex flex-col gap-4">
                  {faqs.map((faq, i) => {
                     const isActive = activeFaq === i;
                     return (
                        <motion.div 
                           initial={{ opacity: 0, x: 20 }}
                           whileInView={{ opacity: 1, x: 0 }}
                           transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                           viewport={{ once: true }}
                           key={i} 
                           className="border-b border-slate-200 pb-4"
                        >
                           <button 
                              onClick={() => setActiveFaq(isActive ? null : i)}
                              className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
                           >
                              <span className={`text-[17px] md:text-[19px] font-semibold text-slate-900 pr-8 ${poppins.className}`}>
                                 {faq.q}
                              </span>
                              <div className={`text-slate-400 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                              </div>
                           </button>
                           
                           {/* Accordion Content */}
                           <motion.div
                              initial={false}
                              animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                           >
                              <p className={`text-slate-500 text-[15px] md:text-base leading-relaxed pb-6 pr-4 md:pr-12 ${jakarta.className}`}>
                                 {faq.a}
                              </p>
                           </motion.div>
                        </motion.div>
                     );
                  })}
               </div>

            </div>
         </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}
