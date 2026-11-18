'use client';
import React, { useState } from 'react';
import { 
  IconCheck, 
  IconDeviceDesktop, 
  IconPlus,
  IconSparkles,
  IconEye,
  IconArrowRight,
  IconX
} from '@tabler/icons-react';

export default function PageBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState('template1');
  const [prompt, setPrompt] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const PROMPT_SUGGESTIONS = [
    { label: 'Toko Kuliner & Minuman', text: 'Buatkan landing page kedai minuman jus buah dan jajanan kekinian dengan aksen warna segar, tombol order WhatsApp, dan galeri menu terlaris.' },
    { label: 'Fashion & Aksesoris', text: 'Buatkan halaman toko pakaian muslim kasual dengan nuansa earth tone minimalis, katalog produk unggulan, dan testimoni pelanggan.' },
    { label: 'Camilan & Snack UMKM', text: 'Buatkan katalog online untuk produk keripik dan camilan kemasan, fokus pada harga promo paket grosir dan kemudahan pemesanan.' }
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setToastMessage('Harap masukkan nama toko atau brand Anda.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsPreviewModalOpen(true);
      setToastMessage('Halaman toko online berhasil dibuat oleh AI!');
      setTimeout(() => setToastMessage(null), 3500);
    }, 1500);
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1280px] mx-auto space-y-6 font-jakarta">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <IconCheck className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-zinc-700">
            <IconX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section (Tanpa Icon di samping H1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">AI Page Builder</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Buat halaman etalase toko online bisnis Anda dalam hitungan detik dengan bantuan kecerdasan buatan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-zinc-200/90 rounded-xl text-zinc-700 text-xs font-semibold shadow-2xs hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <IconEye className="w-3.5 h-3.5 text-zinc-500" />
            <span>Lihat Contoh Halaman</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Detail Konten (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-zinc-900">Detail Konten Halaman</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Lengkapi instruksi dan informasi produk utama toko online Anda</p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            
            {/* Prompt AI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700">
                  Prompt AI (Instruksi Desain)
                </label>
                <span className="text-[10px] text-zinc-400">Jelaskan tema & fokus halaman</span>
              </div>
              <textarea 
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Contoh: Buatkan halaman toko jus buah dan camilan dengan tema segar, tombol pemesanan WhatsApp cepat, dan penawaran paket hemat..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all resize-none shadow-2xs"
              />

              {/* Suggestions Pills */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-zinc-400 shrink-0">Contoh:</span>
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(item.text)}
                    className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/70 rounded-lg text-[11px] text-zinc-600 whitespace-nowrap transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nama Toko / Brand */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Nama Toko / Brand Usaha
              </label>
              <input 
                type="text" 
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Misal: Dapur Mama Ria / Segar Bar Fruit" 
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Deskripsi Singkat */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Tagline & Deskripsi Singkat
              </label>
              <textarea 
                rows={2}
                value={shopDesc}
                onChange={(e) => setShopDesc(e.target.value)}
                placeholder="Teks sambutan yang akan tampil di bagian banner atas halaman..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200/90 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:bg-white transition-all resize-none shadow-2xs"
              />
            </div>

            {/* Submit Button (Vibrant 3D Push Button) */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-all border-b-4 border-[#1e40af] active:border-b-0 active:translate-y-1 text-xs sm:text-sm cursor-pointer disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI Sedang Merancang Halaman...</span>
                  </>
                ) : (
                  <>
                    <IconSparkles className="w-4 h-4" />
                    <span>Buat Halaman Sekarang</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: Template Picker (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Pilih Desain Template</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Pilih gaya visual yang cocok untuk produk Anda</p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-[11px] font-semibold border border-zinc-200/60">
                <IconDeviceDesktop className="w-3.5 h-3.5 text-zinc-500" />
                Preview Siap
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Template 1: Modern Clean */}
              <div 
                onClick={() => setSelectedTemplate('template1')}
                className={`group relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all ${
                  selectedTemplate === 'template1' 
                    ? 'border-[#2563eb] shadow-md ring-2 ring-blue-500/10' 
                    : 'border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                <div className="aspect-square bg-zinc-100 w-full relative overflow-hidden">
                  <img 
                    src="/TemplateProduct/Template1.jpeg" 
                    alt="Template 1" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {selectedTemplate === 'template1' && (
                    <div className="absolute top-2.5 right-2.5 bg-[#2563eb] text-white rounded-full p-1 shadow-md">
                      <IconCheck className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className={`p-3.5 bg-white border-t transition-colors ${
                  selectedTemplate === 'template1' ? 'border-blue-100 bg-blue-50/20' : 'border-zinc-100'
                }`}>
                  <h3 className="font-bold text-zinc-900 text-xs">Modern Clean Showcase</h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                    Cocok untuk toko kuliner, fashion, & retail.
                  </p>
                </div>
              </div>

              {/* Template 2: Coming Soon */}
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/60 flex flex-col items-center justify-center text-center p-4 aspect-square">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xs text-zinc-400 mb-2 border border-zinc-200/80">
                  <IconPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-zinc-700 text-xs">Template Lainnya</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Segera Hadir</p>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 mt-5 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Responsif untuk HP & Desktop</span>
            <span className="font-semibold text-zinc-700">Format Siap Publikasi</span>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* MODAL PREVIEW HALAMAN TOKO                               */}
      {/* ======================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in font-jakarta">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-zinc-200/80 transform transition-all">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                  Pratinjau Halaman Toko Online
                </h3>
                <p className="text-[11px] text-zinc-400">Tampilan etalase responsif yang siap Anda bagikan</p>
              </div>
              <button 
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Mock Page Preview */}
            <div className="rounded-xl border border-zinc-200/80 overflow-hidden bg-zinc-50 p-4 space-y-4">
              {/* Header mockup */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/70">
                <div className="font-bold text-zinc-900 text-sm">{shopName || 'Nama Toko Anda'}</div>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Buka</span>
              </div>

              {/* Hero Banner mockup */}
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-xl p-4">
                <div className="text-xs font-bold">{shopName || 'Katalog Resmi Kami'}</div>
                <p className="text-[11px] text-zinc-300 mt-1">
                  {shopDesc || 'Pesan langsung produk berkualitas terbaik kami dengan mudah & cepat.'}
                </p>
              </div>

              {/* Sample Product Grid mockup */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200/70 text-xs">
                  <div className="h-16 bg-zinc-100 rounded-lg mb-2 flex items-center justify-center text-[10px] text-zinc-400 font-medium">Foto Produk 1</div>
                  <div className="font-bold text-zinc-900 truncate">Paket Hemat Spesial</div>
                  <div className="text-blue-600 font-bold text-[11px] mt-0.5">Rp 25.000</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-zinc-200/70 text-xs">
                  <div className="h-16 bg-zinc-100 rounded-lg mb-2 flex items-center justify-center text-[10px] text-zinc-400 font-medium">Foto Produk 2</div>
                  <div className="font-bold text-zinc-900 truncate">Menu Terlaris</div>
                  <div className="text-blue-600 font-bold text-[11px] mt-0.5">Rp 18.000</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-zinc-100">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setToastMessage('Tautan toko online siap dibagikan ke WhatsApp dan Media Sosial!');
                  setIsPreviewModalOpen(false);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span>Bagikan Tautan Toko</span>
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
