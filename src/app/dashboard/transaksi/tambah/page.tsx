"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion } from "framer-motion";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function TambahTransaksiPage() {
  const [formData, setFormData] = useState({
    namaPelanggan: "",
    noWhatsApp: "",
    namaProduk: "",
    jumlah: 1,
    hargaSatuan: "",
    metodePembayaran: "Transfer Bank",
    catatan: "",
  });

  const [loading, setLoading] = useState(false);

  // Perhitungan total
  const harga = parseInt(formData.hargaSatuan.replace(/\D/g, "")) || 0;
  const total = formData.jumlah * harga;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to backend logic
    setTimeout(() => {
      setLoading(false);
      alert("Transaksi berhasil ditambahkan!");
    }, 1000);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className={`p-4 md:p-8 max-w-5xl mx-auto ${jakarta.className}`}>
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2.5 bg-white/60 hover:bg-white backdrop-blur-md rounded-xl border border-slate-200/60 shadow-sm transition-all text-slate-500 hover:text-slate-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tambah Transaksi Baru</h1>
          <p className="text-sm text-slate-500 font-medium">Catat pesanan baru dari pelanggan Anda.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row">
          
          {/* Form Area */}
          <div className="flex-1 p-6 md:p-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Seksi Pelanggan */}
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                  Informasi Pelanggan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Nama Pelanggan</label>
                    <input 
                      type="text" required
                      value={formData.namaPelanggan} onChange={e => setFormData({...formData, namaPelanggan: e.target.value})}
                      placeholder="Mis: Budi Santoso" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
                    <input 
                      type="text" required
                      value={formData.noWhatsApp} onChange={e => setFormData({...formData, noWhatsApp: e.target.value.replace(/\D/g, '')})}
                      placeholder="08123456789" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Seksi Produk */}
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                  Detail Pesanan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="flex flex-col gap-1.5 md:col-span-6">
                    <label className="text-sm font-semibold text-slate-700">Nama Produk</label>
                    <input 
                      type="text" required
                      value={formData.namaProduk} onChange={e => setFormData({...formData, namaProduk: e.target.value})}
                      placeholder="Mis: Paket Katering Reguler" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Jumlah (Qty)</label>
                    <div className="flex items-center">
                      <button type="button" onClick={() => setFormData({...formData, jumlah: Math.max(1, formData.jumlah - 1)})} className="px-3 py-3 border border-r-0 border-slate-200 rounded-l-xl bg-white/50 hover:bg-slate-50 text-slate-600 transition-colors">-</button>
                      <input 
                        type="number" min="1" required
                        value={formData.jumlah} onChange={e => setFormData({...formData, jumlah: parseInt(e.target.value) || 1})}
                        className="w-full px-0 py-3 border-y border-slate-200 bg-white focus:outline-none text-center text-sm font-semibold text-slate-900"
                      />
                      <button type="button" onClick={() => setFormData({...formData, jumlah: formData.jumlah + 1})} className="px-3 py-3 border border-l-0 border-slate-200 rounded-r-xl bg-white/50 hover:bg-slate-50 text-slate-600 transition-colors">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-4">
                    <label className="text-sm font-semibold text-slate-700">Harga Satuan</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">Rp</span>
                      <input 
                        type="text" required
                        value={formData.hargaSatuan} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          setFormData({...formData, hargaSatuan: val ? parseInt(val).toLocaleString('id-ID') : ""});
                        }}
                        placeholder="0" 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Seksi Tambahan */}
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
                  Informasi Tambahan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Metode Pembayaran</label>
                    <select 
                      value={formData.metodePembayaran} onChange={e => setFormData({...formData, metodePembayaran: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 appearance-none"
                    >
                      <option>Transfer Bank</option>
                      <option>E-Wallet (OVO/GoPay/Dana)</option>
                      <option>Tunai (Cash)</option>
                      <option>QRIS</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Catatan Khusus (Opsional)</label>
                    <input 
                      type="text"
                      value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})}
                      placeholder="Mis: Jangan pakai sambal" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar Ringkasan */}
          <div className="w-full lg:w-[320px] xl:w-[380px] bg-slate-50/50 p-6 md:p-10 border-t lg:border-t-0 lg:border-l border-slate-200/50 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Ringkasan Transaksi</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500">Pelanggan</span>
                  <span className="text-sm font-bold text-slate-800 text-right max-w-[150px] truncate">{formData.namaPelanggan || "-"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500">Produk</span>
                  <span className="text-sm font-bold text-slate-800 text-right max-w-[150px] truncate">{formData.namaProduk || "-"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-500">Qty x Harga</span>
                  <span className="text-sm font-bold text-slate-800 text-right">{formData.jumlah} x {formatRupiah(harga)}</span>
                </div>
                
                <div className="w-full h-px bg-slate-200/80 my-2 border-dashed border-t" />

                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-slate-800">Total Tagihan</span>
                  <span className="text-xl font-black text-blue-600">{formatRupiah(total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <button 
                onClick={handleSubmit} disabled={loading || !formData.namaPelanggan || !formData.namaProduk || !harga}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Menyimpan...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Simpan Transaksi
                  </>
                )}
              </button>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
