"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IconArrowLeft, 
  IconCheck, 
  IconAlertTriangle, 
  IconX, 
  IconChevronDown,
  IconRefresh
} from "@tabler/icons-react";

export default function TambahKeuanganPage() {
  const router = useRouter();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const raw = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
    if (!raw) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(raw);
      if (!user?.id) {
        setErrorMessage("Data sesi akun tidak ditemukan. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const finalKategori = isAddingCustomCategory ? formData.customKategori : formData.kategori;
      const parsedJumlah = parseInt(formData.jumlah.replace(/\D/g, "")) || 0;

      if (!parsedJumlah || parsedJumlah <= 0) {
        setErrorMessage("Jumlah nominal harus lebih dari 0.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/keuangan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          tipe: formData.tipe === "PEMASUKAN" ? "masuk" : "keluar",
          kategori: finalKategori,
          deskripsi: formData.keterangan ? formData.keterangan.trim() : finalKategori,
          jumlah: parsedJumlah,
          tanggal: formData.tanggal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan transaksi.");
      }

      router.push("/dashboard/keuangan");
    } catch (err: any) {
      console.error("Error submitting keuangan:", err);
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan transaksi.");
      setLoading(false);
    }
  };

  const parsedJumlah = parseInt(formData.jumlah.replace(/\D/g, "")) || 0;

  return (
    <div className="p-5 sm:p-8 max-w-[800px] mx-auto space-y-6 font-jakarta">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          href="/dashboard/keuangan" 
          className="p-2 bg-white border border-zinc-200/90 hover:bg-zinc-50 rounded-xl text-zinc-500 hover:text-zinc-800 transition-colors shadow-2xs"
          title="Kembali ke Keuangan"
        >
          <IconArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Catat Laporan Keuangan</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Tambahkan rekap pemasukan atau pengeluaran baru.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-medium">
          <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Segmented Toggle Pemasukan / Pengeluaran */}
          <div className="bg-[#f4f4f5] p-1 rounded-2xl flex items-center w-full">
            <button
              type="button"
              onClick={() => {
                setFormData({...formData, tipe: "PEMASUKAN", kategori: "Penjualan Produk"});
                setIsAddingCustomCategory(false);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                formData.tipe === "PEMASUKAN" 
                  ? "bg-white text-[#2563eb] shadow-sm font-bold" 
                  : "text-zinc-500 hover:text-zinc-800"
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
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                formData.tipe === "PENGELUARAN" 
                  ? "bg-white text-[#e11d48] shadow-sm font-bold" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Grid Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Tanggal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Tanggal</label>
              <input 
                type="date" 
                required
                value={formData.tanggal} 
                onChange={e => setFormData({...formData, tanggal: e.target.value})}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 transition-all text-xs sm:text-sm font-medium text-zinc-900"
              />
            </div>
            
            {/* Kategori */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Kategori</label>
              
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 transition-all text-xs sm:text-sm font-medium text-zinc-900 appearance-none pr-9 cursor-pointer"
                    >
                      {currentKategoriList.map(kat => (
                        <option key={kat} value={kat}>{kat}</option>
                      ))}
                      <option disabled>──────────</option>
                      <option value="TAMBAH_BARU" className="font-semibold text-blue-600">+ Tambah Kategori Baru...</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <IconChevronDown className="w-4 h-4" />
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
                      type="text" 
                      required 
                      autoFocus
                      value={formData.customKategori} 
                      onChange={e => setFormData({...formData, customKategori: e.target.value})}
                      placeholder="Ketik nama kategori baru..."
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-blue-400 bg-blue-50/20 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-xs sm:text-sm font-medium text-zinc-900"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCategory(false);
                        setFormData({...formData, kategori: currentKategoriList[0]});
                      }}
                      className="absolute right-2.5 p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Batal tambah kategori"
                    >
                      <IconX className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Jumlah (Rp) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Jumlah (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-base sm:text-lg">
                Rp
              </span>
              <input 
                type="text" 
                required
                value={formData.jumlah} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setFormData({...formData, jumlah: val ? parseInt(val).toLocaleString('id-ID') : ""});
                }}
                placeholder="0" 
                className={`w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border transition-all text-xl sm:text-2xl font-bold placeholder:text-zinc-300 focus:outline-none ${
                  formData.tipe === "PEMASUKAN" 
                    ? "border-blue-300 focus:border-[#2563eb] text-[#2563eb] bg-white" 
                    : "border-rose-300 focus:border-[#e11d48] text-[#e11d48] bg-white"
                }`}
              />
            </div>
          </div>

          {/* Keterangan / Deskripsi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-700">Keterangan / Deskripsi</label>
            <textarea 
              value={formData.keterangan} 
              onChange={e => setFormData({...formData, keterangan: e.target.value})}
              placeholder="Mis: Pembelian bahan baku untuk minggu ini" 
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 transition-all text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-300 resize-none"
            />
          </div>

          {/* 3D Action Button (Vibrant & Bold 3D Push Button, Tidak Pucat) */}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer select-none transition-all ${
                formData.tipe === "PEMASUKAN" 
                  ? "bg-[#2563eb] hover:bg-[#1d4ed8] border-b-4 border-[#1e40af] shadow-[0_4px_16px_rgba(37,99,235,0.4)] active:border-b-0 active:translate-y-1 active:shadow-none" 
                  : "bg-[#e11d48] hover:bg-[#be123c] border-b-4 border-[#9f1239] shadow-[0_4px_16px_rgba(225,29,72,0.4)] active:border-b-0 active:translate-y-1 active:shadow-none"
              }`}
            >
              {loading ? (
                <>
                  <IconRefresh className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <IconCheck className="w-5 h-5 stroke-[2.5]" />
                  <span>Simpan {formData.tipe === "PEMASUKAN" ? "Pemasukan" : "Pengeluaran"}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
