"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function TambahKeuanganPage() {
  const [formData, setFormData] = useState({
    tipe: "PEMASUKAN",
    tanggal: new Date().toISOString().split("T")[0],
    kategori: "Penjualan Produk",
    customKategori: "",
    jumlah: "",
    keterangan: "",
  });

  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  const kategoriPemasukan = [
    "Penjualan Produk", 
    "Pendapatan Jasa", 
    "Pencairan Dana", 
    "Suntikan Modal", 
    "Bunga Bank",
    "Lain-lain"
  ];
  
  const kategoriPengeluaran = [
    "Bahan Baku", 
    "Operasional", 
    "Gaji Karyawan", 
    "Sewa Tempat", 
    "Pemasaran & Iklan", 
    "Pajak",
    "Transportasi",
    "Lain-lain"
  ];

  const currentKategoriList = formData.tipe === "PEMASUKAN" ? kategoriPemasukan : kategoriPengeluaran;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Jika custom kategori, gunakan nilai dari customKategori
    const finalKategori = isAddingCustomCategory ? formData.customKategori : formData.kategori;
    
    setTimeout(() => {
      setLoading(false);
      alert(`Catatan keuangan berhasil ditambahkan!\nKategori: ${finalKategori}`);
    }, 1000);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  const parsedJumlah = parseInt(formData.jumlah.replace(/\D/g, "")) || 0;

  return (
    <div className={`p-4 md:p-8 max-w-4xl mx-auto ${jakarta.className}`}>
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/keuangan" className="p-2.5 bg-white/60 hover:bg-white backdrop-blur-md rounded-xl border border-slate-200/60 shadow-sm transition-all text-slate-500 hover:text-slate-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catat Laporan Keuangan</h1>
          <p className="text-sm text-slate-500 font-medium">Tambahkan rekap pemasukan atau pengeluaran baru.</p>
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
              
              {/* Toggle Pemasukan / Pengeluaran */}
              <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({...formData, tipe: "PEMASUKAN", kategori: "Penjualan Produk"});
                    setIsAddingCustomCategory(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    formData.tipe === "PEMASUKAN" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({...formData, tipe: "PENGELUARAN", kategori: "Bahan Baku"});
                    setIsAddingCustomCategory(false);
                  }}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    formData.tipe === "PENGELUARAN" 
                      ? "bg-white text-red-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Pengeluaran
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Tanggal</label>
                  <input 
                    type="date" required
                    value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Kategori</label>
                  
                  <AnimatePresence mode="wait">
                    {!isAddingCustomCategory ? (
                      <motion.div 
                        key="select"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative"
                      >
                        <select 
                          value={formData.kategori} 
                          onChange={e => {
                            if (e.target.value === "TAMBAH_BARU") {
                              setIsAddingCustomCategory(true);
                              setFormData({...formData, kategori: "TAMBAH_BARU", customKategori: ""});
                            } else {
                              setFormData({...formData, kategori: e.target.value});
                            }
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 appearance-none"
                        >
                          {currentKategoriList.map(kat => (
                            <option key={kat} value={kat}>{kat}</option>
                          ))}
                          <option disabled>──────────</option>
                          <option value="TAMBAH_BARU" className="font-semibold text-blue-600">+ Tambah Kategori Baru...</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative flex items-center"
                      >
                        <input 
                          type="text" required autoFocus
                          value={formData.customKategori} 
                          onChange={e => setFormData({...formData, customKategori: e.target.value})}
                          placeholder="Ketik kategori baru..."
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-blue-300 bg-blue-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setIsAddingCustomCategory(false);
                            setFormData({...formData, kategori: currentKategoriList[0]});
                          }}
                          className="absolute right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Batal tambah kategori"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Jumlah (Rp)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">Rp</span>
                  <input 
                    type="text" required
                    value={formData.jumlah} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData({...formData, jumlah: val ? parseInt(val).toLocaleString('id-ID') : ""});
                    }}
                    placeholder="0" 
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border ${formData.tipe === "PEMASUKAN" ? "border-blue-200 focus:ring-blue-500/20 focus:border-blue-500 text-blue-700" : "border-red-200 focus:ring-red-500/20 focus:border-red-500 text-red-700"} bg-white/50 focus:bg-white focus:outline-none focus:ring-2 transition-all text-2xl font-bold placeholder:text-slate-300`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Keterangan / Deskripsi</label>
                <textarea 
                  value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})}
                  placeholder="Mis: Pembelian bahan baku untuk minggu ini" 
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <button 
                type="submit" disabled={loading || !parsedJumlah || (isAddingCustomCategory && !formData.customKategori)}
                className={`w-full text-white font-semibold py-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-none disabled:opacity-70 flex items-center justify-center gap-2 ${
                  formData.tipe === "PEMASUKAN" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                }`}
              >
                {loading ? (
                  <span className="animate-pulse">Menyimpan...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    Simpan {formData.tipe === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}
                  </>
                )}
              </button>
            </form>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
